variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-north-1"
}

variable "key_name" {
  description = "Existing EC2 key pair name"
  type        = string
  default     = "europe pem"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)

  default = [
    "10.0.1.0/24",
    "10.0.2.0/24"
  ]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)

  default = [
    "10.0.11.0/24",
    "10.0.12.0/24"
  ]
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "monitoringdb"
}

variable "db_username" {
  description = "PostgreSQL username"
  type        = string
  default     = "monitoringadmin"
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}
