import { LightningElement, wire, track } from 'lwc';

import getDashboardData from
    '@salesforce/apex/CaseDashboardController.getDashboardData';

import searchCases from
    '@salesforce/apex/CaseDashboardController.searchCases';

import processCases from
    '@salesforce/apex/CaseDashboardController.processCases';

import { refreshApex } from '@salesforce/apex';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class CaseManagementDashboard
    extends LightningElement {


    // ============================
    // REACTIVE PROPERTIES
    // ============================

    @track cases = [];

    totalCases = 0;
    openCases = 0;
    highPriorityCases = 0;
    closedToday = 0;

    searchKey = '';

    selectedStatus = 'All';

    selectedPriority = 'All';

    selectedCaseIds = [];

    isLoading = false;

    errorMessage = null;

    wiredDashboardResult;


    // ============================
    // DATATABLE COLUMNS
    // ============================

    columns = [

        {
            label: 'Case Number',
            fieldName: 'CaseNumber',
            type: 'text'
        },

        {
            label: 'Subject',
            fieldName: 'Subject',
            type: 'text'
        },

        {
            label: 'Status',
            fieldName: 'Status',
            type: 'text'
        },

        {
            label: 'Priority',
            fieldName: 'Priority',
            type: 'text'
        },

        {
            label: 'Origin',
            fieldName: 'Origin',
            type: 'text'
        },

        {
            label: 'Owner',
            fieldName: 'OwnerName',
            type: 'text'
        },

        {
            label: 'Created Date',
            fieldName: 'CreatedDate',
            type: 'date'
        }
    ];


    // ============================
    // COMBOBOX OPTIONS
    // ============================

    statusOptions = [

        {
            label: 'All',
            value: 'All'
        },

        {
            label: 'New',
            value: 'New'
        },

        {
            label: 'Working',
            value: 'Working'
        },

        {
            label: 'Escalated',
            value: 'Escalated'
        },

        {
            label: 'Closed',
            value: 'Closed'
        }
    ];


    priorityOptions = [

        {
            label: 'All',
            value: 'All'
        },

        {
            label: 'High',
            value: 'High'
        },

        {
            label: 'Medium',
            value: 'Medium'
        },

        {
            label: 'Low',
            value: 'Low'
        }
    ];


    // ============================
    // @WIRE
    // ============================

    @wire(getDashboardData)
    wiredDashboard(result) {

        this.wiredDashboardResult = result;

        const { data, error } = result;

        if (data) {

            this.totalCases = data.totalCases;

            this.openCases = data.openCases;

            this.highPriorityCases =
                data.highPriorityCases;

            this.closedToday =
                data.closedToday;

            this.cases =
                this.formatCases(data.cases);

            this.errorMessage = null;

        }

        else if (error) {

            this.handleError(error);

        }
    }


    // ============================
    // FORMAT CASE DATA
    // ============================

    formatCases(caseData) {

        return caseData.map(caseRecord => {

            return {

                ...caseRecord,

                OwnerName:
                    caseRecord.Owner
                        ? caseRecord.Owner.Name
                        : ''

            };

        });

    }


    // ============================
    // SEARCH
    // ============================

    handleSearchChange(event) {

        this.searchKey = event.target.value;

        this.performSearch();
    }


    // ============================
    // STATUS FILTER
    // ============================

    handleStatusChange(event) {

        this.selectedStatus =
            event.detail.value;

        this.performSearch();
    }


    // ============================
    // PRIORITY FILTER
    // ============================

    handlePriorityChange(event) {

        this.selectedPriority =
            event.detail.value;

        this.performSearch();
    }


    // ============================
    // IMPERATIVE APEX
    // ============================

    performSearch() {

        this.isLoading = true;

        searchCases({

            searchKey: this.searchKey,

            status: this.selectedStatus,

            priority: this.selectedPriority

        })

        .then(result => {

            this.cases =
                this.formatCases(result);

            this.errorMessage = null;

        })

        .catch(error => {

            this.handleError(error);

        })

        .finally(() => {

            this.isLoading = false;

        });
    }


    // ============================
    // ROW SELECTION
    // ============================

    handleRowSelection(event) {

        const selectedRows =
            event.detail.selectedRows;

        this.selectedCaseIds =
            selectedRows.map(row => row.Id);
    }


    // ============================
    // QUEUEABLE APEX
    // ============================

    handleProcessCases() {

        if (!this.selectedCaseIds.length) {

            this.showToast(
                'Warning',
                'Please select at least one case.',
                'warning'
            );

            return;
        }


        this.isLoading = true;


        processCases({

            caseIds: this.selectedCaseIds

        })

        .then(jobId => {

            this.showToast(
                'Success',
                'Cases submitted for asynchronous processing.',
                'success'
            );

            console.log('Queueable Job Id:', jobId);

            this.selectedCaseIds = [];

        })

        .catch(error => {

            this.handleError(error);

        })

        .finally(() => {

            this.isLoading = false;

        });
    }


    // ============================
    // REFRESH WIRED DATA
    // ============================

    handleRefresh() {

        this.isLoading = true;

        refreshApex(
            this.wiredDashboardResult
        )

        .then(() => {

            this.showToast(
                'Success',
                'Dashboard refreshed.',
                'success'
            );

        })

        .catch(error => {

            this.handleError(error);

        })

        .finally(() => {

            this.isLoading = false;

        });
    }


    // ============================
    // ERROR HANDLING
    // ============================

    handleError(error) {

        console.error(error);

        if (
            error &&
            error.body &&
            error.body.message
        ) {

            this.errorMessage =
                error.body.message;

        }

        else {

            this.errorMessage =
                'An unexpected error occurred.';
        }
    }


    // ============================
    // TOAST
    // ============================

    showToast(title, message, variant) {

        this.dispatchEvent(
            new ShowToastEvent({

                title: title,

                message: message,

                variant: variant

            })
        );
    }

}