/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     02 Aug 2021     Doug Humberd     Handles User Events on Credit Memo Records
 *                          Doug Humberd     Added 'is_cm_invLabelTranslation'
 * 
 */
define(['N/record', 'N/runtime', 'N/search', 'N/email', 'N/render'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(record, runtime, search, email, render) {
	
   
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
    		is_cm_invLabelTranslation(context);
    	}catch(e){
    		is_cm_logError(e);
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

    }

    
    
    
    
    
    function is_cm_invLabelTranslation(context){
    	
    	//Run on Create
    	//if (context.type != 'create' && context.type != 'edit'){
    	if (context.type != 'create'){
    		return;
    	}
    	
    	log.debug('is_cm_invLabelTranslation', 'START');
    	
    	var cmRec = context.newRecord;
    	
    	var custId = cmRec.getValue({
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
					
					cmRec.setValue({
					    fieldId: 'custbody_invoice_label_translation',
					    value: recId,
					    ignoreFieldChange: true
					});
					
					break;
					
				}//End if (recLang == custLanguageTxt)
				
			}//End for x loop
		
		}//End if (resultLength > 0)
    	
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
        //afterSubmit: afterSubmit
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
function is_cm_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}



