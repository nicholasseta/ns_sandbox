/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 Feb 2020     Doug Humberd     Workflow Action script to transform the SO into an Invoice for the "Next Bill"
 * 1.05       18 Mar 2020     Doug Humberd     Updated to not create invoice if Next Bill Date is Empty
 * 1.10       27 Jul 2020     Doug Humberd     Updated to create ALL invoices with a Next Bill Date on or before 14 days from today.  If after 14 days, do not invoice
 * 1.11       15 Apr 2021     Matt Poloni      Refector from JS Date API to NS dates API
 *
 */


/**
 * Constants
 */
//const OA_TM = '10';
//const OA_UPON_COMPL = '11';


/**
 * Returns the appropriate Approver value for the current WF Approval Stage (Purchase Orders)
 * 
 * @returns {Integer} Next Approver Value for Buyer Manager Approval and CEO Approval Stages
 */
function invoiceSO_NextBill() {

    try {

        //Initalize Variables
        var soRec = nlapiGetNewRecord();
        var soId = soRec.getId();
        var done = 'F';

        // var date = new Date(); // SS replacement below
        var date = nlapiStringToDate(nlapiDateToString(new Date(), 'date'));
        var today = nlapiDateToString(date, 'date');
        // date.setDate(date.getDate() + 14); // SS replacement below
        date = nlapiAddDays(date, 14);
        var twoWksFrmToday = nlapiDateToString(date, 'date');
        nlapiLogExecution('DEBUG', 'Today: ' + today, '2 Weeks from Today: ' + twoWksFrmToday);

        while (done == 'F') {

            var searchresults = getNextBillDate(soId);

            if (searchresults) {
                var nextBillDate = searchresults[0].getValue('nextbilldate');
                // var nxtBillDte = new Date(nextBillDate); // SS replacement below
                var nxtBillDte = nlapiStringToDate(nextBillDate, 'date');
                //nlapiLogExecution('DEBUG', 'nxtBillDte', nxtBillDte);
            } else {
                nlapiLogExecution('DEBUG', 'No Search Results', 'BREAK');
                done == 'T';
                break;
            }

            nlapiLogExecution('DEBUG', 'SOID: ' + soId, 'Next Bill Date: ' + nextBillDate);
            //nlapiLogExecution('DEBUG', 'Current Value of DATE', date);

            if (!isEmpty(nextBillDate) && nxtBillDte <= date) {

                nlapiLogExecution('DEBUG', 'Create Invoice for Next Bill Date', nextBillDate)

                var invObj = nlapiTransformRecord('salesorder', soId, 'invoice', { 'billdate': nextBillDate });
                nlapiSubmitRecord(invObj, true);

                var inv = invObj.getId();

                //return inv;

            } else {
                nlapiLogExecution('DEBUG', 'Next Bill Date Either Empty or > 2 Weeks Out', 'BREAK');
                done == 'T';
                break;
            }

        }//End while (done == 'F')


        return soId;


    } catch (e) {
        is_invoiceSO_NextBill_logError(e);
        return 0;
    }

}


/**
 * Writes an error message to the Script Execution Log
 * 
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 * 
 * @returns {Void}
 */
function is_invoiceSO_NextBill_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



function getNextBillDate(soId) {

    //Define filters
    var filters = new Array();
    filters.push(new nlobjSearchFilter('mainline', null, 'is', 'F'));
    filters.push(new nlobjSearchFilter('billingschedule', null, 'noneof', '@NONE@'));
    filters.push(new nlobjSearchFilter('internalid', null, 'anyof', soId));

    // Define columns
    var columns = new Array();
    columns.push(new nlobjSearchColumn('internalid', null, null));
    columns.push(new nlobjSearchColumn('nextbilldate', null, null));

    // Get results
    var results = nlapiSearchRecord('salesorder', null, filters, columns);

    // Return
    return results;

}



function isEmpty(stValue) {
    if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
        return true;
    }

    return false;
}

