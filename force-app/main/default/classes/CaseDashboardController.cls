public with sharing class CaseDashboardController {

    /*
     * Wrapper class used to send multiple pieces
     * of dashboard information to LWC.
     */
    public class DashboardWrapper {

        @AuraEnabled
        public Integer totalCases;

        @AuraEnabled
        public Integer openCases;

        @AuraEnabled
        public Integer highPriorityCases;

        @AuraEnabled
        public Integer closedToday;

        @AuraEnabled
        public List<Case> cases;
    }


    /*
     * Method used by @wire in LWC.
     *
     * Since it is cacheable=true, Salesforce can cache
     * the response on the client side.
     */
    @AuraEnabled(cacheable=true)
    public static DashboardWrapper getDashboardData() {

        DashboardWrapper result = new DashboardWrapper();

        result.totalCases = [
            SELECT COUNT()
            FROM Case
        ];

        result.openCases = [
            SELECT COUNT()
            FROM Case
            WHERE IsClosed = false
        ];

        result.highPriorityCases = [
            SELECT COUNT()
            FROM Case
            WHERE Priority = 'High'
            AND IsClosed = false
        ];

        result.closedToday = [
            SELECT COUNT()
            FROM Case
            WHERE IsClosed = true
            AND ClosedDate = TODAY
        ];

        result.cases = [
            SELECT Id,
                   CaseNumber,
                   Subject,
                   Status,
                   Priority,
                   Origin,
                   CreatedDate,
                   Owner.Name
            FROM Case
            ORDER BY CreatedDate DESC
            LIMIT 50
        ];

        return result;
    }


    /*
     * Imperative Apex method.
     *
     * Used when the user searches or filters.
     */
    @AuraEnabled
    public static List<Case> searchCases(
        String searchKey,
        String status,
        String priority
    ) {

        String searchPattern = '%' + searchKey + '%';

        String query =
            'SELECT Id, CaseNumber, Subject, Status, ' +
            'Priority, Origin, CreatedDate, Owner.Name ' +
            'FROM Case WHERE Subject LIKE :searchPattern';

        if (status != null && status != 'All') {
            query += ' AND Status = :status';
        }

        if (priority != null && priority != 'All') {
            query += ' AND Priority = :priority';
        }

        query += ' ORDER BY CreatedDate DESC LIMIT 50';

        return Database.query(query);
    }


    /*
     * Method used to enqueue asynchronous processing.
     */
    @AuraEnabled
    public static String processCases(List<Id> caseIds) {

        if (caseIds == null || caseIds.isEmpty()) {
            throw new AuraHandledException('No cases selected.');
        }

        Id jobId = System.enqueueJob(
            new CaseProcessingQueueable(caseIds)
        );

        return String.valueOf(jobId);
    }
}