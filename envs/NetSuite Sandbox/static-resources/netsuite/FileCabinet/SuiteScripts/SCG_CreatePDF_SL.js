/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       28 Dec 2021     Doug Humberd     Creates Invoice PDF Files, attaches to invoice and saves in File Cabinet
 *
 */

const PRINTED_INVOICES = '3224402';//Folder: Printed Invoices

/**
 * Moves the Certent Purchase Order approval workflow to the appropriate state when the Approve or Reject buttons are clicked
 * 
 * @appliedtorecord purchaseorder
 * 
 * @param {Object} request The Suitelet request object
 * @param {Object} response The Suitelet response object
 * @returns {Void}
 */
function is_inv_createPDF(request, response) {
	try {
		// Get the Purchase Order ID
		var invId = request.getParameter('invid');
		var tranId = request.getParameter('tranid');
		var subId = request.getParameter('subid');
		nlapiLogExecution('DEBUG', 'invId', invId);
		nlapiLogExecution('DEBUG', 'tranId', tranId);
		nlapiLogExecution('DEBUG', 'subId', subId);
		if (!invId) {
			throw nlapiCreateError('MISSING_RECORD_ID', 'No Invoice ID was received', false);
		}
		if (!tranId) {
			throw nlapiCreateError('MISSING_BUTTON_ID', 'No Transaction ID was received', false);
		}
		if (!subId) {
			throw nlapiCreateError('MISSING_CURRENT_STATE', 'No Subsidiary ID was received', false);
		}
		
		
		var now = new Date();
		nlapiLogExecution('DEBUG', 'Now', now);
		
		var dateTime = nlapiDateToString(now, 'datetime');
		nlapiLogExecution('DEBUG', 'Date Time', dateTime);
		
		var zero = '0';
		var month = now.getMonth() + 1;
		var day = now.getDate();
		var year = now.getFullYear();
		var hour = now.getHours();
		nlapiLogExecution('DEBUG', 'Hour', hour);
		if (hour < 10){
			hour = zero.concat(hour);
		}
		var min = now.getMinutes();
		if (min < 10){
			min = zero.concat(min);
		}
		
		
		var pdfName = 'Invoice_' + subId + '-' + tranId + '_' + year + month + day + '_' + hour + min;
		nlapiLogExecution('DEBUG', 'PDF Name', pdfName);
		
		
		nlapiLogExecution('DEBUG', 'Ready to Create Invoice PDF', invId);
		
		
		var pdfFile = nlapiPrintRecord('TRANSACTION', invId, 'PDF', null);
		

		//pdfFile.folder = PRINTED_INVOICES;
		pdfFile.setFolder(PRINTED_INVOICES);
        //pdfFile.name = pdfName + '.pdf';
		pdfFile.setName(pdfName + '.pdf');
		
		//var fileId = pdfFile.save();
		var fileId = nlapiSubmitFile(pdfFile);
		
		nlapiAttachRecord('file', fileId, 'invoice', invId);
		
		
		// Redirect user to the updated record (if not Auto Approved)
		nlapiSetRedirectURL('RECORD', 'invoice', invId);

		
	} catch(e) {
		if (e instanceof nlobjError) {
			nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails() );
			throw e;
		} else {
			nlapiLogExecution( 'ERROR', 'unexpected error', e.toString() );
			throw e;
		}
	}
}