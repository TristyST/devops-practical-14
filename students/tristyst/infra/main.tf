terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 6.0, < 8.0"
    }
  }
}

provider "google" {
  project = "devops-practical-14"
  region  = "europe-west1"
  zone    = "europe-west1-b"
}

# Existing Google Compute Engine VM.
# It will be imported into Terraform, not recreated.
resource "google_compute_instance" "devops_test" {
  name         = "devops-test"
  machine_type = "e2-medium"
  zone         = "europe-west1-b"
  project      = "devops-practical-14"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-13"
      size  = 10
      type  = "pd-balanced"
    }
  }

  network_interface {
    network = "default"

    access_config {}
  }

  tags = ["campus-helpdesk"]

  # Preserve the existing VM configuration and SSH metadata.
  lifecycle {
    ignore_changes = all
  }
}

# Existing firewall rule for the Campus Helpdesk API.
resource "google_compute_firewall" "campus_helpdesk_api" {
  name    = "allow-campus-helpdesk-api"
  description = "Allow public access to Campus Helpdesk API"
  project = "devops-practical-14"
  network = "default"

  direction     = "INGRESS"
  priority      = 1000
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["campus-helpdesk"]

  allow {
    protocol = "tcp"
    ports    = ["3000"]
  }
}

output "vm_external_ip" {
  description = "External IP address of the Campus Helpdesk VM"
  value       = google_compute_instance.devops_test.network_interface[0].access_config[0].nat_ip
}

output "api_url" {
  description = "Campus Helpdesk API health endpoint"
  value       = "http://${google_compute_instance.devops_test.network_interface[0].access_config[0].nat_ip}:3000/health"
}
