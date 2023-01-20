/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     03 Dec 2020     Doug Humberd     Handles User Events on Invoice Records
 *                          Doug Humberd     Calculates and sets the 'Count of Jet Lines' field when Invoice Saved
 * 1.05     08 Jan 2021     Doug Humberd     Added 'is_inv_reqTrainingPDF'
 * 1.10     19 Feb 2021     Doug Humberd     Added 'is_inv_invLabelTranslation'
 * 1.15     05 Apr 2021     Doug Humberd     Updated 'is_inv_reqTrainingPDF' with additional logic
 * 1.20     22 Dec 2021     Doug Humberd     Added logic to Create Invoice PDFs and save to File Cabinet.  Also added a 'Recreate PDF File" button
 * 1.25     06 Jul 2022     Doug Humberd     Added 'is_inv_setInvoiceApprovalStatus' to set the Invoice Approval Status on create
 * 
 */
define(['N/record', 'N/runtime', 'N/search', 'N/email', 'N/render', 'N/ui/serverWidget', 'N/format'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(record, runtime, search, email, render, serverWidget, format) {
	
	const BUSINESSLINE_JET = '6';//Business Line: Jet
	const BILLABLE_EXPENSES = '1138';//Non-Inventory Item: Billable Expenses
	const VIAREPORT_SAS = '122';//Subsidiary: Viareport SAS
	const VIAREPORT_LTD = '123';//Subsidiary: Viareport Ltd
	const VIAREPORT_SARLAU = '124';//Subsidiary: Viareport SARLAU
	const PRINTED_INVOICES = '3224402';//Folder: Printed Invoices
	const OPENAIR = '2';//Originating System: OpenAir
	
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {string} context.type - Trigger type
     * @param {Form} context.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(context) {
    	
    	try{
    		is_inv_addRecreatePDFbutton(context);
    	}catch(e){
    		is_inv_logError(e);
    	}

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {Record} context.oldRecord - Old record
     * @param {string} context.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(context) {
    	
    	try{
    		is_inv_countofJetLines(context);
    		is_inv_reqTrainingPDF(context);
    		is_inv_invLabelTranslation(context);
    		//is_inv_setInvoiceApprovalStatus(context);
    	}catch(e){
    		is_inv_logError(e);
    	}

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {Record} context.oldRecord - Old record
     * @param {string} context.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(context) {
    	
    	try{
    		is_inv_createPDFfile(context);
    	}catch(e){
    		is_inv_logError(e);
    	}

    }

    
    
    
    
    
    function is_inv_countofJetLines(context){
    	
    	//Run on Create and Edit
    	if (context.type != 'create' && context.type != 'edit'){
    		return;
    	}
    	
    	var invRec = context.newRecord;
    	var invId = invRec.id;
    	var jetCount = 0;
    	
    	var itemCount = invRec.getLineCount({
    	    sublistId: 'item'
    	});
    	log.debug('Item Count', itemCount);
    	
    	for (var i = 0; i < itemCount; i++){
    		
    		var businessLine = invRec.getSublistValue({
			    sublistId: 'item',
			    fieldId: 'custcol_so_business_line',
			    line: i
			});
			log.debug('Business Line - Line ' + i, businessLine);
			
			if (businessLine == BUSINESSLINE_JET){
				log.debug('Jet Business Line Found', 'Increment Count of Jet Lines');
				jetCount = Number(jetCount) + 1;
			}
    		
    	}//End for i loop
    	
    	log.debug('Total Number of Jet Lines', jetCount);
    	
    	invRec.setValue({
    	    fieldId: 'custbody_count_of_jet_lines',
    	    value: jetCount,
    	    ignoreFieldChange: true
    	});
    	
    }
    
    
    
    
    
    function is_inv_reqTrainingPDF(context){
    	
    	//Run on Create
    	//if (context.type != 'create' && context.type != 'edit'){
    	if (context.type != 'create'){
    		return;
    	}
    	log.debug('Requires Training PDF', 'START');
    	
    	var invRec = context.newRecord;
    	
    	var subsidiary = invRec.getValue({
    	    fieldId: 'subsidiary'
    	});
    	log.debug('Subsidiary', subsidiary);
    	
    	var itemCount = invRec.getLineCount({
    	    sublistId: 'item'
    	});
    	
    	for (var i = 0; i < itemCount; i++){
    		
    		var reqTrainPDF = invRec.getSublistValue({
			    sublistId: 'item',
			    fieldId: 'custcol_scg_req_train_pdf',
			    line: i
			});
			log.debug('Requires Training PDF - Line ' + i, reqTrainPDF);
			
			var item = invRec.getSublistValue({
			    sublistId: 'item',
			    fieldId: 'item',
			    line: i
			});
			log.debug('Item - Line ' + i, item);
			
			if (reqTrainPDF == true || (item == BILLABLE_EXPENSES && (subsidiary == VIAREPORT_SAS || subsidiary == VIAREPORT_LTD || subsidiary == VIAREPORT_SARLAU))){
				
				log.debug('Either Requires Training PDF Found CHECKED on Line ' + i + ' or Item = Billable Expenses and Subsidiary is Viareport', 'Check Pending Training Attachment and Exit');
				
				invRec.setValue({
		    	    fieldId: 'custbody_scg_pend_train_attch',
		    	    value: true,
		    	    ignoreFieldChange: false
		    	});
				
				return;
				
			}//End if (reqTrainPDF == true)
    		
    	}//End for i loop
    	
    	log.debug('Requires Training PDF is NOT CHECKED on any line AND no Item/Subsidiary match found', 'Do Not Check Pending Training Attachment');
    	
    }
    
    
    
    
    
    
    
    
    function is_inv_invLabelTranslation(context){
    	
    	//Run on Create
    	//if (context.type != 'create' && context.type != 'edit'){
    	if (context.type != 'create'){
    		return;
    	}
    	
    	log.debug('is_inv_invLabelTranslation', 'START');
    	
    	var invRec = context.newRecord;
    	
    	var custId = invRec.getValue({
    	    fieldId: 'entity'
    	});
    	log.debug('Customer ID', custId);
    	
    	var custFields = search.lookupFields({
    	    type: 'customer',
    	    id: custId,
    	    columns: ['language']
    	});
    	log.debug('Customer Fields', custFields);
    	
    	var custLanguage = '';
    	var custLanguageTxt = '';
    	if (!isEmpty(custFields.language)){
    		custLanguage = custFields.language[0].value;
    		custLanguageTxt = custFields.language[0].text;
    	}
    	log.debug('Customer Language', custLanguage);
    	log.debug('Customer Language Text', custLanguageTxt);
    	
    	
    	//Get the Internal Id for the Income Label Translation Record
    	var searchresults = search.create({
			type:'customrecord_invoice_label',
			columns: [
		          search.createColumn({
		        	  name: 'internalid'
		          }),
		          search.createColumn({
		        	  name: 'custrecord_inv_label_language'
		          })
			          ],
            //filters: [
                //['internalid', 'anyof', revElmtId]
            //]
		});
		
		var result = searchresults.run();
    	
		var resultRange = result.getRange({
	        start: 0,
	        end: 1000
	    });
    	
		var resultLength = resultRange.length;
		log.debug('Result Length', resultLength);
    	
		if (resultLength > 0){
			
			log.debug('Search Results Found', 'SUCCESS');
			
			for (var x = 0; x < resultLength; x++){
				
				var recId = resultRange[x].getValue({
		            name: 'internalid'
		        });
				
				var recLang = resultRange[x].getText({
					name: 'custrecord_inv_label_language'
				});
				
				log.debug('Custom Record Int ID for Result ' + x, recId);
				log.debug('Language for Result ' + x, recLang);
				
				
				if (recLang == custLanguageTxt){
					
					log.debug('Got a Hit!', 'Update Invoice');
					
					invRec.setValue({
					    fieldId: 'custbody_invoice_label_translation',
					    value: recId,
					    ignoreFieldChange: true
					});
					
					break;
					
				}//End if (recLang == custLanguageTxt)
				
			}//End for x loop
		
		}//End if (resultLength > 0)
    	
    }
    
    
    
    
    
    
    function is_inv_addRecreatePDFbutton(context){
    	
    	if (context.type == 'view'){
    		
    		log.debug('addRecreatePDFbutton', 'START');
    		
    		var invRec = context.newRecord;
    		
    		var custId = invRec.getValue({
        	    fieldId: 'entity'
        	});
        	log.debug('Customer ID', custId);
        	
        	var custFields = search.lookupFields({
        	    type: 'customer',
        	    id: custId,
        	    columns: ['custentity_scg_mult_inv_emails', 'printtransactions']
        	});
        	log.debug('Customer Fields', custFields);
        	
        	var multInvEmails = '';
        	if (!isEmpty(custFields.custentity_scg_mult_inv_emails)){
        		multInvEmails = custFields.custentity_scg_mult_inv_emails;
        	}
        	log.debug('Multiple Invoice Emails', multInvEmails);
        	
        	var printTrans = custFields.printtransactions;
        	log.debug('Print Transactions', printTrans);
        	
        	
        	//Only run for Customers where 'Multiple Invoice Emails' is empty, OR if "Print" is checked
        	if (isEmpty(multInvEmails) || printTrans == true){
        		
        		log.debug('Criteria Met', 'CREATE BUTTON');
        		
        		var form = context.form;
        		form.addButton({
        		    id : 'custpage_recreate_button',
        		    label : 'Recreate PDF File',
        		    functionName : 'is_inv_recreatePdfClicked'
        		});
        		
        		context.form.clientScriptModulePath =
                    'SuiteScripts/SCG_Invoice_2_CS.js';
        		
        		//form.addButton('custpage_approve_button', 'Approve', 'is_po_approveClicked()');
        		
        	}
    		
    		
    		log.debug('addRecreatePDFbutton', 'END');

    		
    	}
    	
    }
    
    
    
    
    
    
    function is_inv_createPDFfile(context){
    	
    	//Run on Create and Edit
    	if (context.type != 'create' && context.type != 'edit'){
    		return;
    	}
    	
    	log.debug('is_inv_createPDFfile', 'START');
    	
    	var invRec = context.newRecord;
    	var invId = invRec.id;
    	
    	
    	//Only run in Edit Mode if record total changes
    	var amtChanged = 'F';
    	if (context.type == 'edit'){
    		var oldInvRec = context.oldRecord;
    		var oldTotal = oldInvRec.getValue({
        	    fieldId: 'total'
        	});
    		var newTotal = invRec.getValue({
        	    fieldId: 'total'
        	});
    		log.debug('oldTotal = ' + oldTotal, 'newTotal = ' + newTotal);
    		if (newTotal != oldTotal){
    			amtChanged = 'T';
    		}
    	}
    	//amtChanged = 'T';//TEMPORARY CODE FOR TESTING - TO BE REMOVED
    	if (context.type == 'edit' && amtChanged == 'F'){
    		log.debug('NOT in Create Mode, Amount did NOT Change', 'RETURN');
    		return;
    	}
    	
    	
    	//Load Invoice to get Transaction Id (so not 'to be generated' on create)
    	var invoiceRecord = record.load({
    	    type: 'invoice',
    	       id: invId,
    	       isDynamic: true
    	   });
    	
    	
    	var tranId = invoiceRecord.getValue({
    	    fieldId: 'tranid'
    	});
    	log.debug('Invoice TranId', tranId);
    	
    	
    	
    	var subId = invRec.getValue({
    	    fieldId: 'subsidiary'
    	});
    	log.debug('Subsidiary ID', subId);
    	
    	var custId = invRec.getValue({
    	    fieldId: 'entity'
    	});
    	log.debug('Customer ID', custId);
    	
    	var custFields = search.lookupFields({
    	    type: 'customer',
    	    id: custId,
    	    columns: ['custentity_scg_mult_inv_emails', 'printtransactions']
    	});
    	log.debug('Customer Fields', custFields);
    	
    	var multInvEmails = '';
    	if (!isEmpty(custFields.custentity_scg_mult_inv_emails)){
    		multInvEmails = custFields.custentity_scg_mult_inv_emails;
    	}
    	log.debug('Multiple Invoice Emails', multInvEmails);
    	
    	var printTrans = custFields.printtransactions;
    	log.debug('Print Transactions', printTrans);
    	
    	
    	//Only run for Customers where 'Multiple Invoice Emails' is empty, OR if "Print" is checked
    	if (isEmpty(multInvEmails) || printTrans == true){
    		
    		log.debug('Create / Attach PDF', 'CREATE PDF');
    		
    		var now = new Date();
    		log.debug('Now', now);
    		
    		//tranDate.setDate(tranDate.getDate() + Number(daysUntilDue));
			var dateTime = format.format({value: now, type: format.Type.DATETIME});
			log.debug('Date Time', dateTime);
			
			var zero = '0';
			var month = now.getMonth() + 1;
			var day = now.getDate();
			var year = now.getFullYear();
			var hour = now.getHours();
			log.debug('Hour', hour);
			if (hour < 10){
				hour = zero.concat(hour);
			}
			var min = now.getMinutes();
			if (min < 10){
				min = zero.concat(min);
			}
    		
    		var pdfName = 'Invoice_' + subId + '-' + tranId + '_' + year + month + day + '_' + hour + min;
    		log.debug('PDF Name', pdfName);
    		
    		
    		// Generate the PDF file
            var pdfFile = render.transaction({
                entityId: invId,
                printMode: 'PDF'
            });
            log.debug('pdfFile', pdfFile);
            
            
            pdfFile.folder = PRINTED_INVOICES;
            pdfFile.name = pdfName + '.pdf';
            var fileId = pdfFile.save();
            record.attach({
                record: {
                    type: 'file',
                    id: fileId
                },
                to: {
                    type: 'invoice',
                    id: invId
                }
            });
    		
            
    	}//End if (isEmpty(multInvEmails) || printTrans == true)
    	
    	
    }
    
    
    
    
    
    
    function is_inv_setInvoiceApprovalStatus(context){
    	
    	//Run on Create
    	//if (context.type != 'create' && context.type != 'edit'){//TEMP CODE
    	if (context.type != 'create'){
    		return;
    	}
    	
    	log.debug('setInvoiceApprovalStatus', 'START');
    	
    	var invRec = context.newRecord;
    	var invId = invRec.id;
    	log.debug('Invoice Record', invRec);
    	
    	
    	var origSystem = invRec.getValue({
    	    fieldId: 'custbody_originating_system'
    	});
    	log.debug('Originating System', origSystem);
    	
    	//If Originating System != OpenAir, Approve Invoice
		if (origSystem != OPENAIR){
			log.debug('Originating System NOT OpenAir', 'Approve Invoice');
			
			invRec.setValue({
			    fieldId: 'approvalstatus',
			    value: '2',
			    ignoreFieldChange: true
			});
			
			return;
		}
    	
    	
		//If Originating System = OpenAir, check is Posting Period A/R is Locked
		var arLocked;
		
		var postPd = invRec.getValue({
    	    fieldId: 'postingperiod'
    	});
    	log.debug('Posting Period', postPd);
    	
    	
    	var acctPdFields = search.lookupFields({
    	    type: 'accountingperiod',
    	    id: postPd,
    	    columns: ['arlocked']
    	});
    	log.debug('Accounting Period Fields', acctPdFields);
    	
    	arLocked = acctPdFields.arlocked;
    	log.debug('AR Locked', arLocked);


		if (arLocked != true){
			log.debug('Originating System OpenAir, A/R NOT Locked', 'Approve Invoice');
			
			invRec.setValue({
			    fieldId: 'approvalstatus',
			    value: '2',
			    ignoreFieldChange: true
			});
			
		}else{
			log.debug('Originating System OpenAir, A/R LOCKED', 'DO NOT Approve Invoice / Change Date');
			
			invRec.setValue({
			    fieldId: 'approvalstatus',
			    value: '1',
			    ignoreFieldChange: true
			});
			
			var today = new Date();
			log.debug('Today', today);
			
			invRec.setValue({
			    fieldId: 'trandate',
			    value: today,
			    ignoreFieldChange: true
			});
			
		}
		
    	log.debug('setInvoiceApprovalStatus', 'END');
    	
    }
    
    

    
    
    
    function isEmpty(stValue)
    { 
        if ((stValue == '') || (stValue == null) ||(stValue == undefined))
        {
            return true;
        }
        
        return false;
    }  
    
    
    return {
        //beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});





/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord customer
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_inv_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}



