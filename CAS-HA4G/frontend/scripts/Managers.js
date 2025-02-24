// frontend/scripts/Managers.js

import { ApiService } from './ApiService.js';
import { UIUtils } from './UIUtils.js';

export class DataManager {
    #endpoint;
    #columns;

    constructor(endpoint, columns) {
        this.#endpoint = endpoint;
        this.#columns = columns;
    }

    async fetchAll() {
        return await ApiService.fetchData(this.#endpoint);
    }

    async create(data) {
        return await ApiService.createData(this.#endpoint, data);
    }

    async update(id, data) {
        return await ApiService.updateData(this.#endpoint, id, data);
    }

    async delete(id) {
        return await ApiService.deleteData(this.#endpoint, id);
    }

    getColumns() {
        return this.#columns;
    }
}

export class StaffManager extends DataManager {
    constructor() {
        const columns = [
            { key: 'idNumber', label: 'ID', required: true },
            { key: 'forename', label: 'First Name', required: true },
            { key: 'surname', label: 'Last Name', required: true },
            { key: 'dob', label: 'Date of Birth', type: 'date', required: true, 
              format: UIUtils.formatDate },
            { key: 'gender', label: 'Gender', type: 'select', required: true,
              options: [
                  { value: 'M', label: 'Male' },
                  { value: 'F', label: 'Female' },
                  { value: 'Other', label: 'Other' }
              ] }
        ];
        super('staff', columns);
    }
}

export class StudentManager extends DataManager {
    constructor() {
        const columns = [
            { key: 'idNumber', label: 'ID', required: true },
            { key: 'forename', label: 'First Name', required: true },
            { key: 'surname', label: 'Last Name', required: true },
            { key: 'dob', label: 'Date of Birth', type: 'date', required: true, 
              format: UIUtils.formatDate },
            { key: 'gender', label: 'Gender', type: 'select', required: true,
              options: [
                  { value: 'M', label: 'Male' },
                  { value: 'F', label: 'Female' },
                  { value: 'Other', label: 'Other' }
              ] }
        ];
        super('students', columns);
    }
}

export class CourseManager extends DataManager {
    constructor() {
        const columns = [
            { key: 'courseId', label: 'Course ID', required: true },
            { key: 'courseName', label: 'Course Name', required: true },
            { key: 'courseStart', label: 'Start Date', type: 'date', required: true, 
              format: UIUtils.formatDate },
            { key: 'courseLength', label: 'Duration (weeks)', type: 'number', required: true },
            { key: 'courseLocation', label: 'Location', required: true }
        ];
        super('courses', columns);
    }
}

export class EnrollmentManager extends DataManager {
    #cachedStudents = null;
    #cachedCourses = null;

    constructor() {
        const columns = [
            { 
                key: 'studentId', 
                label: 'Student', 
                type: 'select', 
                required: true
            },
            { 
                key: 'courseId', 
                label: 'Course', 
                type: 'select', 
                required: true
            },
            { 
                key: 'enrollmentDate', 
                label: 'Enrollment Date', 
                type: 'date', 
                required: true,
                format: UIUtils.formatDate
            }
        ];
        super('enrollments', columns);
        this.#setupColumnHandlers();
        this.#initializeOptions();
    }

    // Helper function to configure column format and options
    #configureColumn(column, cacheType) {
        const self = this;
        return {
            format: function(value) {
                if (!value) return '';
                const cache = cacheType === 'students' ? self.#cachedStudents : self.#cachedCourses;
                const option = cache?.find(opt => opt.value === value);
                if (!option) return value;
                
                return option.label;
            },
            getOptions: async function() {
                const endpoint = cacheType;
                const options = await ApiService.fetchSelectOptions(endpoint);
                if (cacheType === 'students') {
                    self.#cachedStudents = options;
                } else {
                    self.#cachedCourses = options;
                }
                return options;
            }
        };
    }

    #setupColumnHandlers() {
        const columns = this.getColumns();
        
        // Configure student column (index 0)
        Object.assign(columns[0], this.#configureColumn(columns[0], 'students'));

        // Configure course column (index 1)
        Object.assign(columns[1], this.#configureColumn(columns[1], 'courses'));
    }

    async #initializeOptions() {
        console.log('Initializing options...');
        const columns = this.getColumns();
        await Promise.all([
            columns[0].getOptions(),
            columns[1].getOptions()
        ]);
        console.log('Options initialized');
    }

    clearCache() {
        this.#cachedStudents = null;
        this.#cachedCourses = null;
    }

    async refreshOptions() {
        this.clearCache();
        await this.#initializeOptions();
    }

    getLabelById(obj, type) {
        const cache = type === 'student' ? this.#cachedStudents : this.#cachedCourses;
    
        if (!obj || !cache) {
            console.warn(`Invalid object or cache for type: ${type}`);
            return '';
        }
    
        const option = cache.find(opt => opt.value === obj._id);
        return option ? option.label : 'N/A';
    }    

    async getEnrollmentsByStudent(studentId) {
        return await ApiService.fetchData(`enrollments/student/${studentId}`);
    }

    async getEnrollmentsByCourse(courseId) {
        return await ApiService.fetchData(`enrollments/course/${courseId}`);
    }
}