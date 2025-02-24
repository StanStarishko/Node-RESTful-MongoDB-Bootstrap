// frontend/scripts/ApiService.js

import { UIUtils } from './UIUtils.js';

export class ApiService {
    static #BASE_URL = 'https://cas-ha4d.onrender.com/api';
    //static #BASE_URL = 'http://localhost:5000/api';

    static async #handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error occurred while executing the request');
        }
        return response.json();
    }

    static async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.#BASE_URL}/${endpoint}`);
            const data = await this.#handleResponse(response);
            return data;
        } catch (error) {
            console.error(`Error data retrieval ${endpoint}:`, error);
            throw error;
        }
    }

    static async createData(endpoint, data) {
        try {
            // Check ID uniqueness before creation
            if (data.idNumber || data.courseId) {
                const existingData = await this.fetchData(endpoint);
                const idField = data.idNumber ? 'idNumber' : 'courseId';
                const isDuplicate = existingData.some(item => 
                    item[idField] === data[idField]
                );
                
                if (isDuplicate) {
                    throw new Error(`${idField} must be unique`);
                }
            }

            const response = await fetch(`${this.#BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return this.#handleResponse(response);
        } catch (error) {
            console.error(`Error data creation ${endpoint}:`, error);
            throw error;
        }
    }

    static async updateData(endpoint, id, data) {
        try {
            // Check ID uniqueness for updates
            if (data.idNumber || data.courseId) {
                const existingData = await this.fetchData(endpoint);
                const idField = data.idNumber ? 'idNumber' : 'courseId';
                const isDuplicate = existingData.some(item => 
                    item[idField] === data[idField] && item._id !== id
                );
                
                if (isDuplicate) {
                    throw new Error(`${idField} must be unique`);
                }
            }

            const response = await fetch(`${this.#BASE_URL}/${endpoint}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return this.#handleResponse(response);
        } catch (error) {
            console.error(`Data update error ${endpoint}/${id}:`, error);
            throw error;
        }
    }

    static async deleteData(endpoint, id) {
        try {
            const response = await fetch(`${this.#BASE_URL}/${endpoint}/${id}`, {
                method: 'DELETE'
            });
            return this.#handleResponse(response);
        } catch (error) {
            console.error(`Data deletion error ${endpoint}/${id}:`, error);
            throw error;
        }
    }

    static #formatStudentLabel(student) {
        return `${student.idNumber}  ${student.forename}  ${student.surname}`;
    }

    static #formatCourseLabel(course) {
        const formattedDate = UIUtils.formatDate(new Date(course.courseStart));
        return `${course.courseId}  ${course.courseName}  ${formattedDate}`;
    }

    static async fetchSelectOptions(endpoint) {
        try {
            const data = await this.fetchData(endpoint);
            return data.map(item => {
                let label;
                if (endpoint === 'students') {
                    label = this.#formatStudentLabel(item);
                } else if (endpoint === 'courses') {
                    label = this.#formatCourseLabel(item);
                } else {
                    label = item.idNumber || item.courseId || item.forename;
                }
                
                return {
                    value: item._id,
                    label: label,
                    originalData: item
                };
            });
        } catch (error) {
            console.error(`Error receiving options for ${endpoint}:`, error);
            return [];
        }
    }
}