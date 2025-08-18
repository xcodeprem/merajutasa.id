# Terraform Outputs for MerajutASA.id Infrastructure
# Comprehensive output values for use by other modules and tools

# Cluster Information
output "cluster_id" {
  description = "EKS cluster ID"
  value       = aws_eks_cluster.main.id
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = aws_eks_cluster.main.arn
}

output "cluster_endpoint" {
  description = "EKS cluster API server endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_version" {
  description = "EKS cluster Kubernetes version"
  value       = aws_eks_cluster.main.version
}

output "cluster_platform_version" {
  description = "EKS cluster platform version"
  value       = aws_eks_cluster.main.platform_version
}

output "cluster_status" {
  description = "EKS cluster status"
  value       = aws_eks_cluster.main.status
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

# Node Group Information
output "node_group_arn" {
  description = "EKS node group ARN"
  value       = aws_eks_node_group.main.arn
}

output "node_group_status" {
  description = "EKS node group status"
  value       = aws_eks_node_group.main.status
}

output "node_group_capacity_type" {
  description = "EKS node group capacity type"
  value       = aws_eks_node_group.main.capacity_type
}

output "node_group_instance_types" {
  description = "EKS node group instance types"
  value       = aws_eks_node_group.main.instance_types
}

output "node_group_scaling_config" {
  description = "EKS node group scaling configuration"
  value       = aws_eks_node_group.main.scaling_config
}

# VPC Information
output "vpc_id" {
  description = "VPC ID where the cluster is deployed"
  value       = aws_vpc.main.id
}

output "vpc_arn" {
  description = "VPC ARN"
  value       = aws_vpc.main.arn
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "vpc_default_security_group_id" {
  description = "VPC default security group ID"
  value       = aws_vpc.main.default_security_group_id
}

# Subnet Information
output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_cidrs" {
  description = "List of private subnet CIDR blocks"
  value       = aws_subnet.private[*].cidr_block
}

output "public_subnet_cidrs" {
  description = "List of public subnet CIDR blocks"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_arns" {
  description = "List of private subnet ARNs"
  value       = aws_subnet.private[*].arn
}

output "public_subnet_arns" {
  description = "List of public subnet ARNs"
  value       = aws_subnet.public[*].arn
}

# Internet Gateway Information
output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}

output "internet_gateway_arn" {
  description = "Internet Gateway ARN"
  value       = aws_internet_gateway.main.arn
}

# NAT Gateway Information
output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "List of public IPs associated with the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# Security Group Information
output "cluster_security_group_arn" {
  description = "Amazon Resource Name (ARN) of the cluster security group"
  value       = aws_security_group.eks_cluster.arn
}

output "node_security_group_id" {
  description = "ID of the node security group"
  value       = aws_security_group.eks_nodes.id
}

output "node_security_group_arn" {
  description = "Amazon Resource Name (ARN) of the node security group"
  value       = aws_security_group.eks_nodes.arn
}

# IAM Role Information
output "cluster_iam_role_arn" {
  description = "IAM role ARN of the EKS cluster"
  value       = aws_iam_role.eks_cluster.arn
}

output "cluster_iam_role_name" {
  description = "IAM role name of the EKS cluster"
  value       = aws_iam_role.eks_cluster.name
}

output "node_group_iam_role_arn" {
  description = "IAM role ARN of the EKS node group"
  value       = aws_iam_role.eks_nodes.arn
}

output "node_group_iam_role_name" {
  description = "IAM role name of the EKS node group"
  value       = aws_iam_role.eks_nodes.name
}

# Region and Availability Zone Information
output "region" {
  description = "AWS region where resources are created"
  value       = var.region
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

# Cluster Configuration for kubectl
output "kubectl_config" {
  description = "kubectl configuration block"
  value = {
    cluster_name                      = aws_eks_cluster.main.name
    endpoint                         = aws_eks_cluster.main.endpoint
    region                          = var.region
    certificate_authority_data      = aws_eks_cluster.main.certificate_authority[0].data
  }
  sensitive = true
}

# Configuration for Helm
output "helm_config" {
  description = "Helm configuration for deployments"
  value = {
    cluster_name    = aws_eks_cluster.main.name
    cluster_endpoint = aws_eks_cluster.main.endpoint
    oidc_issuer_url = aws_eks_cluster.main.identity[0].oidc[0].issuer
    region          = var.region
  }
}

# Environment-specific Information
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "cluster_full_name" {
  description = "Full cluster name including environment"
  value       = local.cluster_name
}

# Tags
output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# Resource IDs for other modules
output "resource_ids" {
  description = "Map of resource IDs for use by other modules"
  value = {
    vpc_id                    = aws_vpc.main.id
    cluster_id               = aws_eks_cluster.main.id
    cluster_security_group_id = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
    node_security_group_id   = aws_security_group.eks_nodes.id
    private_subnet_ids       = aws_subnet.private[*].id
    public_subnet_ids        = aws_subnet.public[*].id
  }
}

# Service URLs (to be used by applications)
output "service_endpoints" {
  description = "Service endpoint configuration"
  value = {
    api_server = aws_eks_cluster.main.endpoint
    region     = var.region
    cluster    = aws_eks_cluster.main.name
  }
}