/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 * @NModuleScope SameAccount
 */
 define([],
    /**
     * @param {portlet} portlet
     */
    function() {
        /**
         * Renders PowerBI Suitelet.
         *
         * @param {Object} params
         * @param {Portlet} params.portlet - The portlet object used for rendering
         * @param {number} params.column - Specifies whether portlet is placed in left (1), center (2) or right (3) column of the dashboard
         * @param {string} params.entity - (For custom portlets only) references the customer ID for the selected customer
         * @Since 2015.2
         */
        function renderView(params) {
            params.portlet.title = 'Products in NetSuite and Salesforce BETA';
            var content = '<iframe width="1400" height="750" frameborder="0" src="https://app.powerbi.com/reportEmbed?reportId=f2438e8c-c973-4e8e-837f-192fa7eed733&autoAuth=true&ctid=2f3aa76a-89a8-4468-9894-2b4842b9534b&config=eyJjbHVzdGVyVXJsIjoiaHR0cHM6Ly93YWJpLW5vcnRoLWV1cm9wZS1qLXByaW1hcnktcmVkaXJlY3QuYW5hbHlzaXMud2luZG93cy5uZXQvIn0%3D"></iframe>';
            params.portlet.html = content;
        }
    
        return {
            render: renderView
        };
    });