/** Version  Date                 Author                      Remarks  
 *  1.00	28 Sep 2018    Cherrie Santiago   Initial version  *  */
/**
 * Performs actions immediately after a write event on a record.
 * 
 * @appliedtorecord account
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function acct_afterSubmit(type) {
	try {
		acct_setExternalId(type);
	} catch (e) {
		acct_logError(e);
		throw e;
	}
}


/**
 * Writes an error message to the Script Execution Log
 * 
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 * 
 * @returns {Void}
 */
function acct_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}


/**
 * Sets the External ID on a new Account record.
 * 
 * @appliedtorecord account
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function acct_setExternalId(type) {
    // Only run on create or edit
    if (type != 'create' && type != 'edit')
        return;
    
    // Initialize variables
    var acctRec = nlapiGetNewRecord();
    var acctNum = acctRec.getFieldValue('acctnumber');
    
    // Set the External Id
    nlapiSubmitField('account', acctRec.getId(), 'externalid', acctNum);
}


