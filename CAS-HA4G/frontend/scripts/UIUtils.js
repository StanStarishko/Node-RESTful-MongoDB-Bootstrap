// frontend/scripts/UIUtils.js

export class UIUtils {
    // Show notice with optional type
    static showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Check if the notification container exists
        const mainContent = document.querySelector('#mainContent');
        if (mainContent) {
            mainContent.insertAdjacentElement('afterbegin', alertDiv);
            
            // Automatic closing of the notification
            setTimeout(() => {
                if (alertDiv) alertDiv.remove();
            }, 10000);
        }
    }

    // Show modal dialog with custom title, message, and type
    static showModal(title, message, type = 'info') {
        const modalHtml = `
            <div class="modal fade" id="alertModal" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header bg-${type}">
                            <h5 class="modal-title text-white">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove previous modal if exists
        document.getElementById('alertModal')?.remove();

        // Create and append new modal
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        document.body.appendChild(tempDiv.firstElementChild);

        // Initialize and show modal
        const modalElement = document.getElementById('alertModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

        // Automatically close modal after 5 seconds
        setTimeout(() => {
            modal.hide();
        }, 10000);
    }

    // Date formatting utility
    static formatDate(date) {
        if (!date) return '';
        try {
            return new Date(date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    }

    // Create select element with given options
    static createSelect(options, selectedValue = null) {
        const select = document.createElement('select');
        select.className = 'form-control';

        options.forEach(option => {
            const optElement = document.createElement('option');
            optElement.value = option.value;
            optElement.textContent = option.label;
            if (option.value === selectedValue) {
                optElement.selected = true;
            }
            select.appendChild(optElement);
        });

        return select;
    }
}