/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       05 Dec 2018     Doug Humberd     Handles Client Events on Customer Records
 *                                             Added functionality that validates the "Multiple Invoice Emails" field does not contain any commas or spaces
 *                                             only semi-colons are allowed in between email address entries.
 * 1.10       11 Dec 2018     Doug Humberd     Updated "is_cus_validateMultInvEmails" to check for all invalid characters, and a few additional scenarios
 *
 */

/**
 * Constants
 */


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @returns {Boolean} True to continue save, false to abort save
 */
function is_cus_saveRecord(){
  try {
    var retVal = is_cus_validateMultInvEmails();
    //retVal = (retVal) ? is_cus_saveRecordFunction() : false;
    //retVal = (retVal) ? is_cus_saveRecordFunction() : false;
    return retVal;
  } catch (e) {
    is_cus_logError(e);
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
function is_cus_logError(e) {
  // Log the error based on available details
  if (e instanceof nlobjError) {
    nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
  } else {
    nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
  }
}



/**
 *
 * Validates the "Multiple Invoice Emails" field does not contain any commas or spaces, only semi-colons are allowed in between email address entries.
 * If it does, alert user and do not save record
 */
function is_cus_validateMultInvEmails(){

  // Initialize variables
  var retVal = true;
  var multInvEmail = nlapiGetFieldValue('custentity_scg_mult_inv_emails');
  
  if (!multInvEmail){
	  return retVal;
  }
  
  //Check for Invalid Characters
  if (multInvEmail.indexOf(',') != -1 || multInvEmail.indexOf(' ') != -1 || multInvEmail.indexOf('#') != -1 || multInvEmail.indexOf('<') != -1 || multInvEmail.indexOf('>') != -1 || multInvEmail.indexOf('@@') != -1 || multInvEmail.indexOf('*') != -1 || multInvEmail.indexOf('!') != -1 || multInvEmail.indexOf('%') != -1 || multInvEmail.indexOf('&') != -1){
	  
	  alert ('*** UNABLE TO SAVE ***\n\nThe Multiple Invoice Emails field contains either an invalid character ( , # < > @@ * ! % & ), or a space.\n\nEmail addresses must only be seperated with a semi-colon, be in a valid email format, and can not include any spaces.\n\nPlease correct and resave.');
	  retVal = false;
	  
	  return retVal;
	  
  }
  
  var emailAddresses = multInvEmail.split(";");
  //alert ('emailAddresses = ' + emailAddresses);
	
  if(emailAddresses){
	  
	  var length = emailAddresses.length;
	  
	  for (var i = 0; i < emailAddresses.length; i++){
		 
		  var checkAddress = emailAddresses[i];
		  
		  var character = checkAddress.indexOf('@');
		  var addrLength = checkAddress.length;
		  
		  //Check if @ is missing from any addresses
		  if (character == -1){
			  alert ('*** UNABLE TO SAVE ***\n\nThe Multiple Invoice Emails field contains an address without a @.   ( ' + checkAddress + ' )\n\nEmail addresses must only be seperated with a semi-colon, be in a valid email format, and can not include any spaces.\n\nPlease correct and resave.');
			  retVal = false;
		  }
		  else{
			  
			  //Check if there are any addresses with no value after the @
			  if (addrLength == character + 1){
				  
				  alert ('*** UNABLE TO SAVE ***\n\nThe Multiple Invoice Emails field contains an address with no value after the @.   ( ' + checkAddress + ' )\n\nEmail addresses must only be seperated with a semi-colon, be in a valid email format, and can not include any spaces.\n\nPlease correct and resave.');
				  retVal = false;
				  
			  }
			  
		  }
		  
	  }
	  
  }

  return retVal;
}



