# Course Administration System for Coatbank College (HA4G 35)
---

## Resources:
- [**Project Brief**](/docs/Task%20brief.pdf)  
- [**Project Report**](/docs/HA4G%2035%20Project%20Report.pdf)  
- [**REST API Documentation**](https://documenter.getpostman.com/view/8437769/2sAYX9oM47)  
- **Source Code**:
   - [**Backend**](/backend/)  
   - [**Frontend**](/frontend/)  
- [**Project Documentation**](/docs/)  
- [**Web Application**](https://cas-ha4g.netlify.app/)

---

## Overview
The Course Administration System for Coatbank College was developed to manage and organize data related to staff, students, courses, and enrollments. The system provides a user-friendly interface for adding, deleting, and amending records, as well as generating reports on student enrollments and course participation. The project was developed using modern web technologies, including a **frontend** built with **HTML**, **Bootstrap**, and **JavaScript**, and a **backend** powered by **Node.js** and **MongoDB**.

The system is structured around four main entities: **Staff**, **Student**, **Course**, and **Enrollment**. Each entity has its own set of attributes and operations, which are managed through a series of interconnected modules. The system architecture is designed to be modular, allowing for easy maintenance and future expansion.

### Key Features:
- **Staff Management**: Add, delete, or amend staff records.
- **Student Management**: Add, delete, or amend student records.
- **Course Management**: Add, delete, or amend course records.
- **Enrollment Management**: List all students enrolled in a specific course or all courses a specific student has enrolled in.

---

## Project Development
The project was developed according to the requirements outlined in the **Project Brief**. The system demonstrates the use of **object-oriented programming (OOP)** principles, including **encapsulation**, **inheritance**, and **polymorphism**. The main entities (Staff, Student, Course, and Enrollment) are represented as classes, each with its own properties and methods. The system is designed to be modular, with each class responsible for managing its own data and operations.

### Key Technologies Used:
- **Node.js**: Used to create a **REST API** server and services.
- **MongoDB Atlas**: A cloud-based **non-relational (NoSQL)** database was used to store and manage data.
- **Bootstrap**: Used for the frontend to ensure a responsive and user-friendly interface.
- **Cybersecurity Basics**: The system incorporates basic cybersecurity measures, such as secure API endpoints and data validation, to ensure data integrity and security.

### Main Challenges:
- **Asynchronous Programming**: Handling nested asynchronous functions to ensure data is retrieved and displayed in the correct order.
- **Cloud Service Latency**: Dealing with delays caused by free-tier cloud services, which can result in slower response times during periods of inactivity.

---

## Project Requirements
The project was developed to meet the following requirements:
- **Object-Oriented Programming (OOP)**:
  - **Encapsulation**: Internal workings of objects are hidden, and access is controlled through methods.
  - **Inheritance**: New classes are created by inheriting properties and methods from existing classes.
  - **Polymorphism**: A single interface is used to handle different types of data.
- **Data Management**:
  - Add, delete, or amend Staff, Student, and Course records.
  - List all students enrolled in a specific course.
  - List all courses a specific student has enrolled in.
- **Testing**:
  - **Static Testing**: Manual code review and use of tools like ESLint.
  - **Dynamic Testing**: Functional testing by running the application and providing various inputs.
  - **Unit Testing**: Testing individual components of the system.
  - **Integration Testing**: Ensuring different components of the system work together as expected.
  - **Acceptance Testing**: Ensuring the system meets the requirements specified in the task brief.

---

## Conclusion
The Course Administration System for Coatbank College has been successfully developed and tested. The system meets all the requirements outlined in the task brief and demonstrates the use of **object-oriented programming constructs**, **algorithms**, and **data structures**. The system is ready for deployment and use.

---

This project allowed me to solidify my knowledge in **Node.js**, **REST API** development, **MongoDB Atlas**, and **Bootstrap**, while also applying basic **cybersecurity** principles to ensure a secure and reliable system.