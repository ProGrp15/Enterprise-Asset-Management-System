# 🏢 Enterprise Asset Management System (AssetFlow)

**Enterprise Asset Management System (AssetFlow)** is a cloud-based, multi-tenant Software-as-a-Service (SaaS) platform designed to efficiently manage and monitor organizational assets throughout their lifecycle. The system enables organizations to centrally manage hardware, software, departments, employees, vendors, asset allocation, maintenance schedules, purchase orders, notifications, and audit logs through a secure role-based environment.

## 👥 User Roles & Access Control

The platform supports three primary user roles: **Super Administrator**, **Company Administrator**, and **Employee**, ensuring secure access control and operational transparency. 

* **Company administrators** can manage organizational resources, departments, employees, vendors, and assets.
* **Employees** can request, view, and track allocated assets. 

The system maintains a complete history of asset allocation, maintenance activities, and user actions through an integrated audit logging mechanism.

## 🏗️ System Architecture

The project follows a **microservices-based architecture** and is implemented in **two independent backend technology stacks** to demonstrate enterprise-grade cross-platform development. 

* One backend is developed using **Java Spring Boot (Advanced Java)**.
* The second backend is implemented using **Microsoft .NET**.

Both backends expose RESTful APIs with identical business functionality. This dual implementation showcases technology interoperability, scalability, maintainability, and comparative enterprise backend development practices.

## 💻 Technology Stack

The frontend is developed using **React.js** with **Bootstrap**, providing a responsive and user-friendly interface. **MySQL** serves as the relational database, while **JWT (JSON Web Token)** is used for secure authentication and authorization. The platform is designed to support scalable deployment, allowing multiple organizations to securely manage their resources within a single SaaS application.

## 🤖 AI Integration

To enhance user productivity and operational efficiency, the system integrates a **Generative AI-powered chatbot** that assists users by answering queries, providing contextual guidance, helping with asset search, explaining system features, and supporting day-to-day asset management operations through natural language interaction.

## 🚀 Key Benefits

The proposed solution eliminates manual asset tracking, improves resource utilization, strengthens accountability through audit trails, simplifies maintenance management, and provides organizations with a secure, scalable, and intelligent enterprise asset management platform suitable for modern digital workplaces.
