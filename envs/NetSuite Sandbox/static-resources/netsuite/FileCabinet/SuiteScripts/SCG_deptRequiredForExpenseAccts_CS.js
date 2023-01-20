/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       10 Dec 2020     Doug Humberd     Makes 'Department' mandatory if GL Account Type = Expense or Other Expense if Subsidiary Country is France
 *                                             CURRENT SCRIPT IS ONLY DEPLOYED ON JOURNAL ENTRY AND ADVANCED INTERCOMPANY JOURNAL ENTRY - UNDEPLOYED ON ALL OTHER RECORD TYPES
 *
 */

/**
 * Constants
 */


 /**
 * Logs an exception to the script execution log
 *
 * @appliedtorecord journalentry advintercompanyjournalentry
 *
 * @param {String} e Exception
 * @returns {Void}
 */
function is_mdm_logError (e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error',
			e.getCode() + '\n' + e.getDetails());
		alert(e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
		alert(e.toString());
	}
}

/**
 * Performs actions once the page is fully loaded in the browser
 *
 * @param {String} type Operation types: create, copy, edit
 * @returns {Void}
 */
function is_mdm_pageInit (type) {
	try {
		//is_mdm_pageInitFunction(type);
	} catch (e) {
		is_mdm_logError(e);
		throw e;
	}
}

/**
 * Performs actions when a field is changed in the user's browser
 *
 * @appliedtorecord journalentry advintercompanyjournalentry invoice creditmemo vendorbill
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_mdm_fieldChanged (type, name, linenum) {
	try {
		//is_mdm_fieldChangedFunction(type, name, linenum);
	} catch (e) {
		is_mdm_logError(e);
		throw e;
	}
}

/**
 * Performs actions following a field change after all of the field's
 * child field values are sourced from the server.
 *
 * @param {String} name The name of the field that changed
 * @param {String} type The sublist type
 * @returns {Void}
 */
function is_mdm_postSourcing (name, type) {
	try {
		//is_mdm_postSourcingFunction(name, type);
	} catch (e) {
		is_mdm_logError(e);
		throw e;
	}
}



/**
 * Performs actions prior to a line being added to a sublist
 *
 * @param {String} type - the sublist internal id
 * @returns {Void}
 */
function is_mdm_validateLine(type) {
	try {
		var retValue = false;
		retValue = is_mdm_makeDeptMandatory_VL(type);
		//retValue = (retValue) ? true /* replace with additional function_name() */ : false;
		//is_mdm_validateLineFunction(type);
		return retValue;
	} catch (e) {
		is_mdm_logError(e);
		throw e;
	}
}



/**
 * Performs actions after a line is added to a sublist
 *
 * @param {String} type - the sublist internal id
 * @returns {Void}
 */
function is_mdm_recalc(type) {
	try {
		//is_mdm_recalcFunction(type);
	} catch (e) {
		is_mdm_logError(e);
		throw e;
	}
}






/**
 * Handles validation prior to the form being submitted to the server
 *
 * @returns {Boolean}
 */
function is_mdm_saveRecord () {
	try {
		var retVal = false;
		//retVal = is_mdm_saveRecordFunction();
		//retVal = (retVal) ? true /* replace with additional function_name() */ : false;
		return retVal;
	} catch (e) {
		is_mdm_logError(e);
		throw e;
	}
}




function isEmpty (stValue) {
	if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
		return true;
	}

	return false;
}  



/**
 * Alerts user if the Department field is empty on a line where Account Type = Expense or Other Expense
 *
 * @appliedtorecord journalentry advintercompanyjournalentry invoice creditmemo vendorbill
 *
 */
function is_mdm_makeDeptMandatory_VL(type){
	
	var recType = nlapiGetRecordType();
	//alert ('Record Type = ' + recType);
	
	var subsidiary = nlapiGetFieldValue('subsidiary');
	//alert ('subsidiary = ' + subsidiary);
	
	var subCountry = nlapiLookupField('subsidiary', subsidiary, 'country');
	//alert ('Subsidiary Country = ' + subCountry);
	
	if (subCountry == 'FR'){//France
		
		//*** CURRENTLY NOT DEPLOYED ON INVOICE, CREDIT MEMO, SALES ORDER OR RETURN AUTHORIZATION ***
		if (recType == 'invoice' || recType == 'creditmemo' || recType == 'salesorder' || recType == 'returnauthorization' || recType == 'purchaseorder'){
			//alert(recType + ' code');
			var item = nlapiGetCurrentLineItemValue('item', 'item');
			//alert('item = ' + item);
			
			var itemSearch = getIncAcct(item);
			
			if (itemSearch){
				var account = itemSearch[0].getValue('incomeaccount');
				//alert ('Income Account = ' + account);
				
				var acctRec = nlapiLoadRecord('account', account);
				var acctType = acctRec.getFieldValue('accttype');
				//alert ('Account = ' + account + '\nAccount Type = ' + acctType);
			}
			
			var dept = nlapiGetCurrentLineItemValue('item', 'department');
			
			//if ((acctType == 'Expense' || acctType == 'OthExpense' || acctType == 'OthIncome' || acctType == 'Income' || acctType == 'COGS' || acctType == 'FixedAsset') && isEmpty(dept)){
			if ((acctType == 'Expense' || acctType == 'OthExpense') && isEmpty(dept)){

				alert ('\nDepartment is Required for this line.\n\nPlease enter a value in the Department column.\n');
				
				retValue = false;
				return retValue;
				
			}//End if ((acctType == 'Expense' || acctType == 'OthExpense') && isEmpty(dept))
			
		}//End if (recType == 'invoice' || recType == 'creditmemo')
		
		
		//*** CURRENTLY NOT DEPLOYED ON VENDOR BILL OR VENDOR CREDIT ***
		if (recType == 'vendorbill' || recType == 'vendorcredit'){
			
			//alert (recType + ' code');
			
			var account = nlapiGetCurrentLineItemValue('expense', 'account');
			
			var acctRec = nlapiLoadRecord('account', account);
			var acctType = acctRec.getFieldValue('accttype');
			//alert ('Account = ' + account + '\nAccount Type = ' + acctType);
			
			var dept = nlapiGetCurrentLineItemValue('expense', 'department');
			
			//if ((acctType == 'Expense' || acctType == 'OthExpense' || acctType == 'OthIncome' || acctType == 'Income' || acctType == 'COGS' || acctType == 'FixedAsset') && isEmpty(dept)){
			if ((acctType == 'Expense' || acctType == 'OthExpense') && isEmpty(dept)){

				alert ('\nDepartment is Required for this line.\n\nPlease enter a value in the Department column.\n');
				
				retValue = false;
				return retValue;
				
			}//End if ((acctType == 'Expense' || acctType == 'OthExpense') && isEmpty(dept))
			
		}//End if (recType == 'vendorbill')
		
		
		if (recType == 'journalentry' || recType == 'advintercompanyjournalentry'){
			
			//alert (recType + ' code');
			
			var acctType = nlapiGetCurrentLineItemValue('line', 'accounttype');
			//alert ('Account Type = ' + acctType);
			
			var dept = nlapiGetCurrentLineItemValue('line', 'department');
			
			//if ((acctType == 'Expense' || acctType == 'OthExpense' || acctType == 'OthIncome' || acctType == 'Income' || acctType == 'COGS' || acctType == 'FixedAsset') && isEmpty(dept)){
			if ((acctType == 'Expense' || acctType == 'OthExpense') && isEmpty(dept)){

				alert ('\nDepartment is Required for this line.\n\nPlease enter a value in the Department column.\n');
				
				retValue = false;
				return retValue;
				
			}//End if ((acctType == 'Expense' || acctType == 'OthExpense') && isEmpty(dept))
			
		}//End if (recType == 'journalentry' || recType == 'advintercompanyjournalentry')
		
		
	}//End if (subCountry == 'FR')
	
	
	retValue = true;
	return retValue;
	
}






function getIncAcct(item){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', item));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('incomeaccount', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('item', null, filters, columns);
	  
	// Return
	return results;
	
}





