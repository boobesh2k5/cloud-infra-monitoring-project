terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-statestore-bucket"
    key            = "cloud-infra-monitoring/terraform.tfstate"
    region         = "eu-north-1"
    dynamodb_table = "TerraformDB"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# ---------------------------------------------------------
# DATA
# ---------------------------------------------------------

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true

  owners = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# ---------------------------------------------------------
# VPC
# ---------------------------------------------------------

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "project2-monitoring-vpc"
    Project     = "cloud-infra-monitoring"
    Environment = "dev"
  }
}

# ---------------------------------------------------------
# INTERNET GATEWAY
# ---------------------------------------------------------

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "project2-monitoring-igw"
  }
}

# ---------------------------------------------------------
# PUBLIC SUBNETS
# ---------------------------------------------------------

resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                     = "project2-public-${count.index + 1}"
    Project                  = "cloud-infra-monitoring"
    Tier                     = "public"
    "kubernetes.io/role/elb" = "1"
  }
}

# ---------------------------------------------------------
# PRIVATE SUBNETS
# ---------------------------------------------------------

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                              = "project2-private-${count.index + 1}"
    Project                           = "cloud-infra-monitoring"
    Tier                              = "private"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# ---------------------------------------------------------
# PUBLIC ROUTE TABLE
# ---------------------------------------------------------

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "project2-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ---------------------------------------------------------
# NAT GATEWAYS
# ---------------------------------------------------------

resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name = "project2-nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [
    aws_internet_gateway.main
  ]

  tags = {
    Name = "project2-nat-${count.index + 1}"
  }
}

# ---------------------------------------------------------
# PRIVATE ROUTE TABLES
# ---------------------------------------------------------

resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "project2-private-rt-${count.index + 1}"
  }
}

resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ---------------------------------------------------------
# BASTION SECURITY GROUP
# ---------------------------------------------------------

resource "aws_security_group" "bastion" {
  name        = "project2-bastion-sg"
  description = "Security group for Project 2 bastion host"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH - restrict this to your IP in production"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "project2-bastion-sg"
  }
}

# ---------------------------------------------------------
# BASTION EC2
# ---------------------------------------------------------

resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.public[0].id
  associate_public_ip_address = true

  vpc_security_group_ids = [
    aws_security_group.bastion.id
  ]

  key_name = var.key_name

  tags = {
    Name        = "project2-bastion"
    Project     = "cloud-infra-monitoring"
    Role        = "admin"
    Environment = "dev"
  }
}

# ---------------------------------------------------------
# EKS CLUSTER SECURITY GROUP
# ---------------------------------------------------------

resource "aws_security_group" "eks_cluster" {
  name        = "project2-eks-cluster-sg"
  description = "Security group for EKS control plane"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "project2-eks-cluster-sg"
  }
}

# ---------------------------------------------------------
# EKS NODE SECURITY GROUP
# ---------------------------------------------------------

resource "aws_security_group" "eks_nodes" {
  name        = "project2-eks-nodes-sg"
  description = "Security group for EKS worker nodes"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Node to node communication"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  ingress {
    description     = "Kubernetes API from worker nodes"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  ingress {
    description = "Application traffic from VPC"
    from_port   = 80
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "project2-eks-nodes-sg"
  }
}

# ---------------------------------------------------------
# EKS CLUSTER IAM ROLE
# ---------------------------------------------------------

resource "aws_iam_role" "eks_cluster" {
  name = "project2-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "eks.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Project = "cloud-infra-monitoring"
  }
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

# ---------------------------------------------------------
# EKS NODE IAM ROLE
# ---------------------------------------------------------

resource "aws_iam_role" "eks_nodes" {
  name = "project2-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Project = "cloud-infra-monitoring"
  }
}

resource "aws_iam_role_policy_attachment" "eks_worker_node" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_cni" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "eks_ecr_readonly" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# ---------------------------------------------------------
# EKS CLUSTER
# ---------------------------------------------------------

resource "aws_eks_cluster" "main" {
  name     = "project2-monitoring"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.34"

  access_config {
    authentication_mode = "API_AND_CONFIG_MAP"
  }

  vpc_config {
    subnet_ids = aws_subnet.private[*].id

    security_group_ids = [
      aws_security_group.eks_cluster.id
    ]

    endpoint_private_access = true
    endpoint_public_access  = true
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]

  tags = {
    Name        = "project2-monitoring"
    Project     = "cloud-infra-monitoring"
    Environment = "dev"
  }
}

# ---------------------------------------------------------
# EKS ACCESS FOR TERRAFORM EC2 ROLE
# ---------------------------------------------------------

resource "aws_eks_access_entry" "terraform" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = "arn:aws:iam::363267429195:role/ec2adminaccess"

  type = "STANDARD"

  depends_on = [
    aws_eks_cluster.main
  ]
}

resource "aws_eks_access_policy_association" "terraform_admin" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = "arn:aws:iam::363267429195:role/ec2adminaccess"

  policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }

  depends_on = [
    aws_eks_access_entry.terraform
  ]
}

# ---------------------------------------------------------
# EKS NODE GROUP
# ---------------------------------------------------------

resource "aws_eks_node_group" "main" {
  cluster_name = aws_eks_cluster.main.name

  node_group_name = "project2-workers"

  node_role_arn = aws_iam_role.eks_nodes.arn

  subnet_ids = aws_subnet.private[*].id

  instance_types = [
    "t3.micro"
  ]

  capacity_type = "ON_DEMAND"

  scaling_config {
    desired_size = 3
    min_size     = 2
    max_size     = 3
  }

  update_config {
    max_unavailable = 1
  }

  remote_access {
    ec2_ssh_key = var.key_name

    source_security_group_ids = [
      aws_security_group.bastion.id
    ]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node,
    aws_iam_role_policy_attachment.eks_cni,
    aws_iam_role_policy_attachment.eks_ecr_readonly
  ]

  tags = {
    Name    = "project2-worker"
    Project = "cloud-infra-monitoring"
  }
}

# ---------------------------------------------------------
# RDS SECURITY GROUP
# ---------------------------------------------------------

resource "aws_security_group" "rds" {
  name        = "project2-rds-sg"
  description = "Security group for PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from EKS nodes"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [
      data.aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
    ]
  }

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "project2-rds-sg"
  }
}

# ---------------------------------------------------------
# RDS SUBNET GROUP
# ---------------------------------------------------------

resource "aws_db_subnet_group" "main" {
  name = "project2-rds-subnet-group"

  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "project2-rds-subnet-group"
  }
}

# ---------------------------------------------------------
# RDS POSTGRESQL
# ---------------------------------------------------------

resource "aws_db_instance" "postgres" {
  identifier = "project2-postgres"

  engine         = "postgres"
  engine_version = "16"

  instance_class = "db.t3.micro"

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  port = 5432

  db_subnet_group_name = aws_db_subnet_group.main.name

  vpc_security_group_ids = [
    aws_security_group.rds.id
  ]

  publicly_accessible = false

  multi_az = false

  backup_retention_period = 0

  skip_final_snapshot = true

  deletion_protection = false

  tags = {
    Name        = "project2-postgres"
    Project     = "cloud-infra-monitoring"
    Environment = "dev"
  }
}

# Read the AWS-generated EKS cluster security group
data "aws_eks_cluster" "main" {
  name = aws_eks_cluster.main.name

  depends_on = [
    aws_eks_cluster.main
  ]
}
