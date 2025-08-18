# Terraform Variables for MerajutASA.id Infrastructure
# Comprehensive variable definitions with validation and descriptions

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-west-2"
  
  validation {
    condition = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.region))
    error_message = "Region must be a valid AWS region format."
  }
}

variable "cluster_name" {
  description = "Base name for the EKS cluster"
  type        = string
  default     = "merajutasa"
  
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]*$", var.cluster_name))
    error_message = "Cluster name must start with a letter and contain only alphanumeric characters and hyphens."
  }
}

variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS worker nodes"
  type        = list(string)
  default     = ["t3.medium", "t3.large"]
}

variable "desired_capacity" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 3
  
  validation {
    condition     = var.desired_capacity >= 1 && var.desired_capacity <= 100
    error_message = "Desired capacity must be between 1 and 100."
  }
}

variable "max_capacity" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 10
  
  validation {
    condition     = var.max_capacity >= 1 && var.max_capacity <= 100
    error_message = "Max capacity must be between 1 and 100."
  }
}

variable "min_capacity" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 1
  
  validation {
    condition     = var.min_capacity >= 0 && var.min_capacity <= 10
    error_message = "Min capacity must be between 0 and 10."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in VPC"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "flow_logs_retention_days" {
  description = "Retention period for VPC Flow Logs in days"
  type        = number
  default     = 7
}

variable "cluster_log_types" {
  description = "List of EKS cluster log types to enable"
  type        = list(string)
  default     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
}

variable "cluster_log_retention_days" {
  description = "Retention period for EKS cluster logs in days"
  type        = number
  default     = 7
}

variable "enable_irsa" {
  description = "Enable IAM Roles for Service Accounts"
  type        = bool
  default     = true
}

variable "enable_pod_security_policy" {
  description = "Enable Pod Security Policy"
  type        = bool
  default     = true
}

variable "enable_network_policy" {
  description = "Enable Kubernetes Network Policy"
  type        = bool
  default     = true
}

variable "node_group_ami_type" {
  description = "AMI type for EKS node group"
  type        = string
  default     = "AL2_x86_64"
  
  validation {
    condition = contains([
      "AL2_x86_64",
      "AL2_x86_64_GPU",
      "AL2_ARM_64",
      "CUSTOM"
    ], var.node_group_ami_type)
    error_message = "AMI type must be one of: AL2_x86_64, AL2_x86_64_GPU, AL2_ARM_64, CUSTOM."
  }
}

variable "node_group_capacity_type" {
  description = "Capacity type for EKS node group (ON_DEMAND or SPOT)"
  type        = string
  default     = "ON_DEMAND"
  
  validation {
    condition     = contains(["ON_DEMAND", "SPOT"], var.node_group_capacity_type)
    error_message = "Capacity type must be either ON_DEMAND or SPOT."
  }
}

variable "node_group_disk_size" {
  description = "Disk size in GB for EKS worker nodes"
  type        = number
  default     = 50
  
  validation {
    condition     = var.node_group_disk_size >= 20 && var.node_group_disk_size <= 1000
    error_message = "Node group disk size must be between 20 and 1000 GB."
  }
}

variable "enable_cluster_autoscaler" {
  description = "Enable Cluster Autoscaler"
  type        = bool
  default     = true
}

variable "enable_metrics_server" {
  description = "Enable Metrics Server"
  type        = bool
  default     = true
}

variable "enable_aws_load_balancer_controller" {
  description = "Enable AWS Load Balancer Controller"
  type        = bool
  default     = true
}

variable "enable_external_dns" {
  description = "Enable External DNS"
  type        = bool
  default     = false
}

variable "enable_cert_manager" {
  description = "Enable Cert Manager"
  type        = bool
  default     = true
}

variable "enable_ingress_nginx" {
  description = "Enable NGINX Ingress Controller"
  type        = bool
  default     = true
}

variable "enable_prometheus" {
  description = "Enable Prometheus monitoring stack"
  type        = bool
  default     = true
}

variable "enable_grafana" {
  description = "Enable Grafana dashboards"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
  
  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 365
    error_message = "Backup retention days must be between 1 and 365."
  }
}

variable "enable_encryption_at_rest" {
  description = "Enable encryption at rest for EKS cluster"
  type        = bool
  default     = true
}

variable "kms_key_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7
  
  validation {
    condition     = var.kms_key_deletion_window >= 7 && var.kms_key_deletion_window <= 30
    error_message = "KMS key deletion window must be between 7 and 30 days."
  }
}

variable "enable_private_endpoint" {
  description = "Enable private API server endpoint"
  type        = bool
  default     = true
}

variable "enable_public_endpoint" {
  description = "Enable public API server endpoint"
  type        = bool
  default     = true
}

variable "public_access_cidrs" {
  description = "CIDR blocks that can access the public API server endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}