/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     22 Dec 2021     Doug Humberd     Creates Invoice PDF Files, attaches to invoice and saves in File Cabinet
 * 
 */
define(['N/record', 'N/render', 'N/search', 'N/runtime', 'N/https', 'N/format', 'N/redirect'],
/**
 * @param {record} record
 * @param {render} render
 * @param {search} search
 */
function(record, render, search, runtime, https, format, redirect) {
	
	const PRINTED_INVOICES = '3224402';//Folder: Printed Invoices
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	
    	var scriptObj = runtime.getCurrentScript();
    	log.debug(scriptObj);
        
        var invId = context.request.parameters.invid;
        if(!isEmpty(invId)){
        	invId = Number(invId);
        }
        var tranId = context.request.parameters.tranid;
        var subId = context.request.parameters.subid;
        
        log.debug('Invoice Id', invId);
        log.debug('Transaction Id', tranId);
        log.debug('Subsidiary Id', subId);
        
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
		
		
		
		log.debug('Ready to Create Invoice PDF', invId);
		
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
		
		
		
		redirect.toRecord({
		    type: record.Type.INVOICE,
		    id: invId
		});
		
        //redirect.toTaskLink({
            //id: 'CARD_-29'
        //});
		

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
        onRequest: onRequest
    };
    
});
