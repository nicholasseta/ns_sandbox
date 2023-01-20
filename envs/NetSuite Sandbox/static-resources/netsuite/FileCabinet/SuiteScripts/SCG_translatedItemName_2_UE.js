/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     08 Jan 2021     Doug Humberd     Sets the 'Translated Item Name' if the customer language preference is not English
 * 1.05     19 Jan 2021     Doug Humberd     Updated to
 * 1.10     17 Nov 2022     Doug Humberd     Updated to optimize performance (minimize runtimes) by reducing the record loads.  Also moved to beforeSubmit
 *  
 * 
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
   
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
			is_tin_translatedItemName(context);
		}catch(e){
			is_tin_logError(e);
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
    		//is_tin_translatedItemName(context);//Moved to beforeSubmit 11-17-22
    	}catch(e){
    		is_tin_logError(e);
    	}

    }
    
    
    
    
    
    
    function is_tin_translatedItemName(context){
    	
    	//Run on Create and Edit
    	if (context.type != 'create' && context.type != 'edit'){
    		return;
    	}
    	
    	var rec = context.newRecord;
    	//log.debug('context.newRecord', rec);
    	
    	var recId = rec.id;
    	//var recId = context.newRecord.id;
    	var recType = rec.type;
    	
    	log.debug('Record Type = ' + recType, 'Record Id = ' + recId);
    	
    	var custId = rec.getValue({
    	    fieldId: 'entity'
    	});
    	log.debug('Customer ID', custId);
    	
    	var custFields = search.lookupFields({
    	    type: 'customer',
    	    id: custId,
    	    columns: ['language']
    	});
    	log.debug('Customer Fields', custFields);
    	
    	var language = '';
		var languageText = '';
    	if (!isEmpty(custFields.language)){
    		language = custFields.language[0].value;
			languageText = custFields.language[0].text;
    	}
    	log.debug('Language', language);
		log.debug('Language Text', languageText);
    	
    	//If Language = English(US), set to English(International)
    	if (language == 'en_US'){
    		language = 'en';
    	}
    	
    	//if (!isEmpty(language) && language != 'en_US' && language != 'en'){
    	if (!isEmpty(language)){
    		
    		//log.debug('Language Found, and is NOT English(US) or English(International)', 'Update Item Name (Translated)');
    		log.debug('Language Found', 'Update Item Name (Translated)');


			//*******************************************************************


			// Search for Items with a translation value
			var searchresults = search.create({
				type:'item',
				columns: [
					search.createColumn({
						name: 'formulatext',
						formula: "{internalid} ||'_' ||{language}",
						label: 'arrayid'
					}),
					search.createColumn({
						name: 'internalid',
						label: 'Internal ID'
					}),
					search.createColumn({
						name: 'language',
						sort: search.Sort.ASC,
						label: 'Language'
					}),
					search.createColumn({name: 'displayname', label: 'Display Name'}),
					search.createColumn({name: 'salesdescription', label: 'Description'}),
					search.createColumn({name: 'displaynametranslated', label: 'Display Name (Translated)'}),
					search.createColumn({name: 'salesdescriptiontranslated', label: 'Sales Description (Translated)'})
				],
				filters: [
					['displaynametranslated','isnotempty',''],
					'OR',
					['salesdescriptiontranslated','isnotempty','']
				]
			});

			// Run the search
			var result = searchresults.run();
			var resultRange = result.getRange({
				start: 0,
				end: 1000
			});
			var resultLength = resultRange.length;
			log.debug('Search Result Length', resultLength);

			if (resultLength == 0){
				log.debug('No Item Translations found', 'EXIT');
				return;
			}

			var itemTranslationObj = {};

			// Loop through the search results
			for (var s = 0; resultLength > 0 && s < resultLength; s++) {

				itemIntId = resultRange[s].getValue({
					name: 'internalid'
				});
				//log.debug('Search Item ID result ' + s, itemIntId);

				arrayId = resultRange[s].getValue({
					name: 'formulatext'
				});
				//log.debug('Array ID result ' + s, arrayId);

				transDispName = resultRange[s].getValue({
					name: 'displaynametranslated'
				});
				//log.debug('Translated Display Name result ' + s, transDispName);

				itemTranslationObj[arrayId] = transDispName;

			}


			log.debug('Item Translation Obj', JSON.stringify(itemTranslationObj));

    		
    		//Load the Transaction Record
			//var transactionRec = record.load({
			    //type: recType,
			    //id: recId,
			    //isDynamic: false,
			//});
    		
    		
    		var itemCount = rec.getLineCount({
        	    sublistId: 'item'
        	});
        	
        	for (var i = 0; i < itemCount; i++){
        		
        		var item = rec.getSublistValue({
    			    sublistId: 'item',
    			    fieldId: 'item',
    			    line: i
    			});
    			//log.debug('Item - Line ' + i, item);

				var itemLang = item + '_' + languageText;
				log.debug('Concat Item_Language Line ' + i, itemLang);

				/*
    			
    			var itemType = rec.getSublistValue({
    			    sublistId: 'item',
    			    fieldId: 'itemtype',
    			    line: i
    			});
    			log.debug('Item Type - Line ' + i, itemType);
    			
    			var itemRecType = '';
    			
    			switch(itemType){
    			
    			case 'Assembly':
    				itemRecType = 'assemblyitem';
    				break;
    				
    			case 'Descriptio​n':
    				itemRecType = 'descriptionitem';
    				break;
    				
    			case 'Discount':
    				itemRecType = 'discountitem';
    				break;
    				
    			case 'DwnLdItem':
    				itemRecType = 'downloaditem';
    				break;
    				
    			case 'GiftCert':
    				itemRecType = 'giftcertificateitem';
    				break;
    				
    			case 'Group':
    				itemRecType = 'itemgroup';
    				break;
    				
    			case 'InvtPart':
    				itemRecType = 'inventoryitem';
    				break;
    				
    			case 'Kit':
    				itemRecType = 'kititem';
    				break;
    				
    			case 'Markup':
    				itemRecType = 'markupitem';
    				break;
    				
    			case 'NonInvtPart':
    				itemRecType = 'noninventoryitem';
    				break;
    				
    			case 'OthCharge':
    				itemRecType = 'otherchargeitem';
    				break;
    				
    			case 'Payment':
    				itemRecType = 'paymentitem';
    				break;
    				
    			case 'Service':
    				itemRecType = 'serviceitem';
    				break;
    				
    			case 'ShipItem':
    				itemRecType = 'shipitem';
    				break;
    				
    			case 'Subtotal':
    				itemRecType = 'subtotalitem';
    				break;
    				
    			default:
    				
    			}//End switch(itemType)
    			
    			log.debug('Item Record Type Line ' + i, itemRecType);
    			
    			if (isEmpty(itemRecType)){
    				continue;
    			}

				*/

				/*
    			
    			//Load the Item Record
    			var itemRec = record.load({
    			    type: itemRecType,
    			    id: item,
    			    isDynamic: true,
    			});
    			
    			//Locate the Appropriate Language Line, and get the Display Name
    			var translationCount = itemRec.getLineCount({
    	    	    sublistId: 'translations'
    	    	});
    	    	
    	    	for (var x = 0; x < translationCount; x++){
    	    		
    	    		var itemTransLang = itemRec.getSublistValue({
        			    sublistId: 'translations',
        			    fieldId: 'locale',
        			    line: x
        			});
        			log.debug('Item Translation Language - Line ' + x, itemTransLang);
        			
        			if (itemTransLang == language){
        				
        				log.debug('Item Translation Language Found', 'Get Display Name');
        				
        				var itemTransDispName = itemRec.getSublistValue({
            			    sublistId: 'translations',
            			    fieldId: 'displayname',
            			    line: x
        				});
        				log.debug('Transation DisplayName from Item', itemTransDispName);
        				
        				
        				
        				//Set the Item Name (Translated) value on the appropriate Transaction Record Line
        				if (!isEmpty(itemTransDispName)){
        					
        					//transactionRec.setSublistValue({
							rec.setSublistValue({
            				    sublistId: 'item',
            				    fieldId: 'custcol_item_name_translated',
            				    line: i,
            				    value: itemTransDispName
            				});
        					
        					break;
        					
        				}
        				
        			}
    	    		
    	    	}//End for x loop

				*/

				var itemTransDispName = itemTranslationObj[itemLang];
				log.debug('Item Translation Display Name', itemTransDispName);


				//Set the Item Name (Translated) value on the appropriate Transaction Record Line
				if (!isEmpty(itemTransDispName)){

					//transactionRec.setSublistValue({
					rec.setSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_item_name_translated',
						line: i,
						value: itemTransDispName
					});

				}//End if (!isEmpty(itemTransDispName))

        		
        	}//End for i loop
        	
        	//transactionRec.save({
        	    //enableSourcing: true,
        	    //ignoreMandatoryFields: true
        	//});
    		
    	}//End if (!isEmpty(language) && language != 'en_US')
    	
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
function is_tin_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}



