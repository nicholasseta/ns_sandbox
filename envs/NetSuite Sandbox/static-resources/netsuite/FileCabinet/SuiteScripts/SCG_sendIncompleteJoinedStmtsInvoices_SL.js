/**
 * Module Description
 *
 * Version			Date			Author				Remarks
 * 1.00				05 Dec 2019		Doug Humberd		Executes a Scheduled Script to Join and Send Previously Incomplete Combined Statements / Open Overdue Invoices to Customers
 *
 */


/**
 * Constants
 */


/**
 * Global Variables
 */
//var is_sijsi_context = nlapiGetContext();


/**
 * Logs an exception to the script execution log
 *
 * @appliedtorecord customer invoice
 *
 * @param {String} e Exception
 * @returns {Void}
 */
function is_sijsi_logError(e) {
    // Log the error based on available details
    var errorMessage = (e instanceof nlobjError) ? {'code': e.getCode(), 'details': e.getDetails(), 'stackTrace': e.getStackTrace()}: {'code': '', 'details': e.toString(), 'stackTrace': ''};
    nlapiLogExecution('ERROR', 'System Error', JSON.stringify(errorMessage));
}


/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function is_sijsi_sendIncompleteStmtsInvoices(request, response){
	nlapiLogExecution('DEBUG', 'Send Incomplete Statements SL', 'START');
    if (request.getMethod()=='GET') {
        try	{
        	
        	var form = nlapiCreateForm('Reprocess Incomplete Records?');
        	
        	form.addSubmitButton('Process Records');

            response.writePage(form);
        	
        } catch (e) {
            is_sijsi_logError(e);
            throw e;
        }
    } else {
        try {
        	
        	//var scriptSched = 'Test';
        	var scriptSched = nlapiScheduleScript('customscript_scg_sendincjoindstmtinvs_ss', 'customdeploy_scg_sendincjoindstmtinvs_ss');
            nlapiLogExecution('DEBUG', 'Deployment Scheduled: ' + ' Status: ' + scriptSched, '');
            nlapiSetRedirectURL('TASKLINK', 'LIST_SCRIPTSTATUS', null, null, {'scripttype': is_sijsi_getScriptInternalId('customscript_scg_sendincjoindstmtinvs_ss')});
            
        } catch (e) {
            is_sijsi_logError(e);
            throw e;
        }
    }
}


/**
 * Returns the internal id of the given script
 *
 * @appliedtorecord script
 *
 * @param {Array} scriptId: identifier given to this script
 * @returns {Integer}
 */
function is_sijsi_getScriptInternalId(scriptId) {
    // Initialize variables
    var scriptInternalId = '';

    // Define filters
    var filters = new Array();
    filters.push(new nlobjSearchFilter('scriptid', null, 'is', scriptId));

    // Define columns
    var columns = new Array();
    columns.push(new nlobjSearchColumn('name', null, null));

    // Get results
    var results = nlapiSearchRecord('script', null, filters, columns);
    if (results && results.length > 0) {
        scriptInternalId = results[0].getId();
    }

    // Return
    return scriptInternalId;
}



