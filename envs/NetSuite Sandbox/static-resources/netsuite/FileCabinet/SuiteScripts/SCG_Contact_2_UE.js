/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     13 Oct 2020     Doug Humberd     Handles User Events on Contact Records
 *                          Doug Humberd     Updates Multiple Invoice Email field on Customer record when Contact created/edited
 * 1.05     22 Dec 2020     Doug Humberd     Updated 'is_cont_updCust_multInvEmail' to not run if Customer = BainAlum
 * 1.10     21 Jun 2022     Doug Humberd     Updated 'is_cont_updCust_multInvEmail' to handle deletes, inactivations, and customer changes
 *  
 * 
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
	
	const BAINALUM_1 = '2892374';//Customer: BainAlum
	const BAINALUM_2 = '2892409';//Customer: BainAlum
	const BAINALUM_3 = '2892464';//Customer: BainAlum
   
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
    		is_cont_updCust_multInvEmail(context);
    	}catch(e){
    		is_cont_logError(e);
    	}

    }
    
    
    
    function is_cont_updCust_multInvEmail(context){
    	
    	//Run on Create and Edit
    	if (context.type != 'create' && context.type != 'edit'){
    		return;
    	}
    	
    	log.debug('updCust_multInvEmail', 'START');
    	log.debug('Execution Type', context.type);
    	
    	var contRec = context.newRecord;
    	
    	var removeFromOldCust = 'N';
    	
    	var custId = contRec.getValue({
			fieldId: 'company'
		});
    	log.debug('Customer ID', custId);
    	
    	//Do Not Run if Customer = BainAlum
    	if (custId == BAINALUM_1 || custId == BAINALUM_2 || custId == BAINALUM_3){
    		log.debug('Customer = BainAlum', 'DO NOT UPDATE MIE');
    		return;
    	}
    	
    	var contEmail = contRec.getValue({
			fieldId: 'email'
		});
    	log.debug('Contact Email', contEmail);
    	
    	if (isEmpty(custId) || isEmpty(contEmail)){
    		log.debug('Either No Customer ID, or No Email', 'EXIT');
    		return;
    	}
    	
    	
    	if (context.type == 'edit'){
    		
    		var oldContRec = context.oldRecord;
    		
    		var oldCustId = oldContRec.getValue({
    			fieldId: 'company'
    		});
        	log.debug('Original Customer ID', oldCustId);
        	
        	var wasInactive = oldContRec.getValue({
    			fieldId: 'isinactive'
    		});
        	log.debug('Was Inactive', wasInactive);
        	
        	var isInactive = contRec.getValue({
    			fieldId: 'isinactive'
    		});
        	log.debug('Is Inactive', isInactive);
        	
        	if (custId != oldCustId || (wasInactive != isInactive && isInactive == true)){
        		log.debug('Customer Changed, or Contact now Inactive', 'REMOVE EMAIL FROM MIE');
        		removeFromOldCust = 'Y';
        	}
    		
    	}
    	
    	
    	var invDel = contRec.getValue({
			fieldId: 'custentity_invoice_delivery'
		});
    	log.debug('Invoice Delivery', invDel);
    	
    	
    	//Load Customer
    	var custRec = record.load({
		    type: record.Type.CUSTOMER,
		    id: custId,
		    isDynamic: true,
		});
    	
    	var multInvEmail = custRec.getValue({
			fieldId: 'custentity_scg_mult_inv_emails'
		});
    	log.debug('Mult Invoice Email', multInvEmail);
    	
    	if (invDel == true){
    		
    		if (isEmpty(multInvEmail)){
        		
    			log.debug('Mult Inv Emails Empty', 'MIE = Contact Email Only')
        		custRec.setValue({
        		    fieldId: 'custentity_scg_mult_inv_emails',
        		    value: contEmail,
        		    ignoreFieldChange: false
        		});
        		
        	}else{// !isEmpty(multInvEmail)
        		
        		if (multInvEmail.indexOf(contEmail) == -1){
        			
        			log.debug('Contact Email not in Mult Inv Email', 'Append Value to MIE');
        			
        			multInvEmail = multInvEmail + ';' + contEmail;
        			
        			custRec.setValue({
            		    fieldId: 'custentity_scg_mult_inv_emails',
            		    value: multInvEmail,
            		    ignoreFieldChange: false
            		});
        			
        		}else{
        			log.debug('Contact Email Already in Mult Inv Email', 'Do NOT Append with Contact Email');
        		}
        		
        	}//End if (!isEmpty(multInvEmail))
    		
    	}else{//invDel == false
    		
    		if (multInvEmail.indexOf(contEmail) == -1){
    			log.debug('Contact Email is NOT already in Mult Inv Email', 'Nothing to Remove');
    		}else{
    			
    			log.debug('Contact Email is in Mult Inv Email', 'REMOVE value');
    			
    			var semiBefore = ';' + contEmail;
    			log.debug('Semi Before', semiBefore);
    			
    			while (multInvEmail.indexOf(semiBefore) != -1){
					multInvEmail = multInvEmail.replace(semiBefore, '');
				}
    			log.debug('Mult Inv Email After Semi Before Email Removal', multInvEmail);
    			
    			while (multInvEmail.indexOf(contEmail) != -1){
					multInvEmail = multInvEmail.replace(contEmail, '');
				}
    			log.debug('Mult Inv Email After Email Removal', multInvEmail);
    			
    			while (multInvEmail.indexOf(';;') != -1){
					multInvEmail = multInvEmail.replace(';;', ';');
				}
    			log.debug('Mult Inv Email After Multi-Semicolon Fix', multInvEmail);
    			
    			if (multInvEmail.indexOf(';') == 0){
    				multInvEmail = multInvEmail.replace(';', '');
    			}
    			
    			log.debug('Mult Inv Email - FINAL', multInvEmail);
    			
    			
    			custRec.setValue({
        		    fieldId: 'custentity_scg_mult_inv_emails',
        		    value: multInvEmail,
        		    ignoreFieldChange: false
        		});
    			
    		}
    		
    	}//End if (invDel == false)
    	
    	
    	var recordId = custRec.save({
    	    //enableSourcing: true,
    	    //ignoreMandatoryFields: true
    	});
    	
    	
    	//If the Customer was changed, or if the contact was made inactive, remove email from the original customer
    	if (removeFromOldCust == 'Y'){
    		
    		//Load Original Customer
        	var origCustRec = record.load({
    		    type: record.Type.CUSTOMER,
    		    id: oldCustId,
    		    isDynamic: true,
    		});
        	
        	var origMultInvEmail = origCustRec.getValue({
    			fieldId: 'custentity_scg_mult_inv_emails'
    		});
        	log.debug('Mult Invoice Email from Original Customer', origMultInvEmail);
        	
        	
        	if (origMultInvEmail.indexOf(contEmail) == -1){
    			log.debug('Contact Email is NOT already in Mult Inv Email for Original Customer', 'Nothing to Remove');
    		}else{
    			
    			log.debug('Contact Email is in Mult Inv Email for Origianl Customer', 'REMOVE value');
    			
    			var semiBefore = ';' + contEmail;
    			log.debug('Semi Before (Orig Cust)', semiBefore);
    			
    			while (origMultInvEmail.indexOf(semiBefore) != -1){
					origMultInvEmail = origMultInvEmail.replace(semiBefore, '');
				}
    			log.debug('Mult Inv Email (Orig Cust) After Semi Before Email Removal', origMultInvEmail);
    			
    			while (origMultInvEmail.indexOf(contEmail) != -1){
					origMultInvEmail = origMultInvEmail.replace(contEmail, '');
				}
    			log.debug('Mult Inv Email (Orig Cust) After Email Removal', origMultInvEmail);
    			
    			while (origMultInvEmail.indexOf(';;') != -1){
					origMultInvEmail = origMultInvEmail.replace(';;', ';');
				}
    			log.debug('Mult Inv Email (Orig Cust) After Multi-Semicolon Fix', origMultInvEmail);
    			
    			if (origMultInvEmail.indexOf(';') == 0){
    				origMultInvEmail = origMultInvEmail.replace(';', '');
    			}
    			
    			log.debug('Mult Inv Email (Orig Cust) - FINAL', origMultInvEmail);
    			
    			
    			origCustRec.setValue({
        		    fieldId: 'custentity_scg_mult_inv_emails',
        		    value: origMultInvEmail,
        		    ignoreFieldChange: false
        		});
    			
    			
    			var recordId = origCustRec.save({
    	    	    //enableSourcing: true,
    	    	    //ignoreMandatoryFields: true
    	    	});
    			
    		}
        	
    		
    	}//End if (removeFromOldCust == 'Y')
    	
    	
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
        //beforeSubmit: beforeSubmit,
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
function is_cont_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}



