# Kittoch-Car-Hire Project
---

## Resources:
- [**Project Brief**](docs/Project%20Brief.pdf)
- [**Project Report**](docs/Project%20Report.pdf)
- [**REST API** documentation](https://documenter.getpostman.com/view/8437769/2sAYJ9AdsE)
- **Source Code**:
   - [**Backend**](backend)
   - [**Frontend**](frontend)
- [**Project Documentation**](docs)
- [**Web site**](https://kittoch-car-hire.netlify.app/)

---

## Overview
The web application code was written and tested from 20 December 2024 to 5 January 2025. When I started the project, I only had the [Project Brief](docs/Project%20Brief.pdf) and absolutely no experience or knowledge in: **Node.JS**, creating, configuring and [deploying (on Render)](https://render.com/) my own **REST API** server and services, configuring and working with **non-relational (non-SQL)** databases, I used the **MongoDB Atlas** cloud service and **Bootstrap** for the frontend. 

***In just two weeks***, I achieved good results. I learned all of these new technologies and applied them in practice in a short time.

#### *Main challenges* that I had to "fight" (*troubleshooting*):
- **asynchronous programming**. I liked solving the problem with calls to nested asynchronous functions, which caused the records from the database to be returned in a random order, i.e. the sorting was "knocked out". I had to study this problem and find a solution to prevent this from happening.
- **falling asleep** of cloud services when using free plans if they are not accessed frequently. As a result, when you first log into the application, authorization could take about two minutes and filling out dashboard pages could take 30+ seconds if there were about two minutes of inactivity
  
