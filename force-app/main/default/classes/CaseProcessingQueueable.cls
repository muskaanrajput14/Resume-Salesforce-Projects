public with sharing class CaseProcessingQueueable
    implements Queueable {

    private List<Id> caseIds;


    public CaseProcessingQueueable(List<Id> caseIds) {
        this.caseIds = caseIds;
    }


    public void execute(QueueableContext context) {

        List<Case> casesToUpdate = [
            SELECT Id,
                   Status,
                   Description
            FROM Case
            WHERE Id IN :caseIds
        ];

        for (Case c : casesToUpdate) {

            /*
             * Example asynchronous business processing.
             *
             * In a real project this could be:
             * - Calling an external API
             * - Sending notifications
             * - Updating related records
             * - Performing heavy calculations
             */

            if (c.Status != 'Closed') {
                c.Description =
                    'Processed asynchronously by Case Queueable.';
            }
        }

        if (!casesToUpdate.isEmpty()) {
            update casesToUpdate;
        }
    }
}