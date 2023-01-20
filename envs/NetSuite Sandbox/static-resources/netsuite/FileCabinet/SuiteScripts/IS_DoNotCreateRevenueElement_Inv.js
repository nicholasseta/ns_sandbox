/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType UserEventScript
 * @see https://system.netsuite.com/app/help/helpcenter.nl?fid=section_4387799721.html
 *
 * Version  Date            Author           Remark
 * 1.00     Unknown         Neocol           Original Version
 * 1.05     10 Dec 2021     Doug Humberd     Updated to skip lines if createrevenueplanson is Empty
 * 1.10     29 Dec 2021     Doug Humberd     Updated to check for ARM Source Ext Id value, and also to include 'uncheck' scenarios
 * 1.15     04 Feb 2022     Doug Humberd     Updated to not check 'Sync to SF'
 * 1.20     25 Mar 2022     Doug Humberd     Updated to check for 'Element Override' value - always check if this is checked
 * 1.25     15 Jun 2022     Doug Humberd     Updated to set the ARM Source External ID (Line) value (migrated from workflow 'SCG | Project/ARM Source Ext ID on Trxn' to solve for timing issues)
 * 1.30     19 Jul 2022     Doug Humberd     Updated to set the NetSuite Order Product (Line) value when the ARM Source External ID is updated
 * 1.31     15 Aug 2022     Doug Humberd     Added Governance / Line Count Logging
 *
 */
define(['N/search', 'N/record', 'N/runtime'], /**
 * @return {{
 *   beforeLoad?: Function,
 *   beforeSubmit?: Function,
 *   afterSubmit?: Function,
 * }}
 */ function (search, record, runtime) {
    /**
     * @param {BeforeLoadContext} context
     * @return {void}
     */
    function beforeLoad(context) {
        try {
            log.audit('beforeLoad', {
                type: context.type,
                form: context.form,
                newRecord: {
                    type: context.newRecord.type,
                    id: context.newRecord.id
                },
                request: !context.request
                    ? null
                    : {
                          url: context.request.url,
                          parameters: context.request.parameters
                      }
            });
        } catch (e) {
            log.error('beforeLoad', JSON.parse(JSON.stringify(e)));
        }
    }

    /**
     * @param {BeforeSubmitContext} context
     * @return {void}
     */
    function beforeSubmit(context) {
        try {
            log.audit('beforeSubmit', {
                type: context.type,
                newRecord: {
                    type: context.newRecord.type,
                    id: context.newRecord.id
                }
                //oldRecord: {
                //type: context.oldRecord.type,
                //id: context.oldRecord.id,
                //},
            });
        } catch (e) {
            log.error('beforeSubmit', JSON.parse(JSON.stringify(e)));
        }
        
        var script = runtime.getCurrentScript();
        var linesCounted = 0;

        var type = context.type;
        var newRecord = context.newRecord;
        //var oldRecord = context.oldRecord

        if (context.type != 'create') {
            var oldRecord = context.oldRecord;
            log.audit(
                'type: ' + context.oldRecord.type,
                'id: ' + context.oldRecord.id
            );
        }

        /* 
            log.debug('type = ' + type, 'set Tax override START');

            var taxAmountOverride = newRecord.getValue('custbody_sf_inv_tax_total')
            log.debug('taxAmountOverride', taxAmountOverride)

            if(!isEmpty(taxAmountOverride)) {
                newRecord.setValue('taxamountoverride', taxAmountOverride)
            }
            log.debug('type = ' + type, 'set Tax override END');
            */

        log.debug('type = ' + type, 'set Do Not Create Revenue Element START');
        
        //var orderRefUpdated = 'N';//Only necessary if logic to write 'NetSuite Order Reference' is added to script

        var armDate = new Date('10/11/2021');
        log.debug('ARM Date', armDate);

        var dateCreated = newRecord.getValue({
            fieldId: 'custbody_datetime_created'
        });
        log.debug('Date Created', dateCreated);

        if (isEmpty(dateCreated)) {
            dateCreated = new Date('10/10/2021');
            log.debug('Date Created Empty', 'Set to 10/10/21 to ARM Source Ext ID Not Updated');
        }

        if (dateCreated >= armDate) {
            log.debug('Date Created on or after ARM Date', 'OK to Update ARM Source External ID');
        } else {
            log.debug('Date Created before ARM Date', 'NOT OK to Update ARM Source External ID');
        }
        
        log.debug('Governance Before Line Loop', script.getRemainingUsage());

        var invLineCount = newRecord.getLineCount({
            sublistId: 'item'
        });

        log.debug('invLineCount', invLineCount);

        for (var i = 0; invLineCount != 0 && i < invLineCount; i++) {
            var itemId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });
            log.debug('itemId', itemId);

            // get create plans on from item
            var createRevPlansOn = search.lookupFields({
                type: search.Type.ITEM,
                id: itemId,
                columns: ['createrevenueplanson']
            });
            log.debug('createRevPlansOn', createRevPlansOn);

            // get stamped line item rev rule
            var lineItemRevenueRule = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_rev_rec_rule',
                line: i
            });

            var armSrcExtId = '';

            var projId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'job',
                line: i
            });
            log.debug('projId', projId);

            if (!isEmpty(projId) && dateCreated >= armDate) {
                var projFields = search.lookupFields({
                    type: search.Type.JOB,
                    id: projId,
                    columns: ['custentity_sf_order_product_id']
                });
                log.debug('Project Fields', projFields);

                if (!isEmpty(projFields.custentity_sf_order_product_id)) {
                    //armSrcExtId = projFields.custentity_sf_order_product_id[0].value;
                    armSrcExtId = projFields.custentity_sf_order_product_id;
                }
                log.debug('SF Order Project ID (from Project)', armSrcExtId);
            } //End if (!isEmpty(projId))

            log.debug('ARM Source External ID', armSrcExtId);

            //var armSrcExtId = newRecord.getSublistValue({
            //sublistId: 'item',
            //fieldId: 'custcol_arm_sourceexternalid',
            //line: i
            //});

            var existArmSrcExtId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_arm_sourceexternalid',
                line: i
            });
            log.debug('Existing ARM Source External ID (on the Line)', existArmSrcExtId);

            var elmtOverride = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_dont_create_rev_override',
                line: i
            });
            log.debug('Override Do Not Create Element', elmtOverride);

            var nativeCreateRevenueElement = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'donotcreaterevenueelement',
                line: i
            });
            log.debug('nativeCreateRevenueElement', nativeCreateRevenueElement);

            if (isEmpty(armSrcExtId) && !isEmpty(existArmSrcExtId)) {
                armSrcExtId = existArmSrcExtId;
            }

            //If ARM Source Ext Id is not empty, check the box
            //Updated to also set the ARM Source Ext Id on the line (if currently empty)
            if (!isEmpty(armSrcExtId)) {
                if (isEmpty(existArmSrcExtId)) {
                	
                    newRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_arm_sourceexternalid',
                        line: i,
                        value: armSrcExtId
                    });
                    
                    
                    //Identify and Update the 'NetSuite Order Product' on the line
                    var ordprodsearchresults = search.create({
            			type:'customrecord_contractlines',
            			columns: [
            		          search.createColumn({
            		        	  name: 'internalid',
            		        	  sort: search.Sort.ASC
            		          })
            			          ],
                        filters: [
                            ['externalid', 'anyof', armSrcExtId] 
                        ]
            		});
            		
            		var ordprodresult = ordprodsearchresults.run();
                	
            		var ordprodresultRange = ordprodresult.getRange({
            	        start: 0,
            	        end: 1
            	    });
                	
            		var ordprodresultLength = ordprodresultRange.length;
            		log.debug('Order Product Search Result Length', ordprodresultLength);
                	
            		if (ordprodresultLength > 0){
            			
            			log.debug('Order Product Search Results Found', 'SUCCESS');
            			
            			//for (var x = 0; x < ordprodresultLength; x++){
                      		
                  		var ordProdId = ordprodresultRange[0].getValue({
                            name: 'internalid'
                  		});
                  		log.debug('Order Product ID from Result', ordProdId);
                  		
                  		if (!isEmpty(ordProdId)){
                  		
                  			newRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_reference_contractline',
                                line: i,
                                value: ordProdId
                            });
                  			
                  			
                  			/*
                  			//Lookup and Update the 'NetSuite Order Reference' field if it hasn't been updated already
                  			if (orderRefUpdated == 'N'){
                  				
                  			    //Get the Order from the Order Product Record
                  	            var orderReference = search.lookupFields({
                  	                type: customrecord_contractlines,
                  	                id: ordProdId,
                  	                columns: ['custrecord_is_cl_order']
                  	            });
                  	            log.debug('Order from Order Product', orderReference);//createRevPlansOn.createrevenueplanson[0].value
                  	            
                  	            
                  				
                  			}//End if (orderRefUpdated == 'N')
                  			*/
                  			
                  			
                  		}//End if (!isEmpty(ordProdId))
                      		          		
                      	//}//End for x loop
            		
            		}else{
            			log.debug('Order Product Search Results Not Found', 'NO ORDER PRODUCT');//orderRefUpdated
            		}
                    
                    
                } //End if (isEmpty(existArmSrcExtId))

                newRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'donotcreaterevenueelement',
                    line: i,
                    value: true
                });

                //continue;
            }
            //if ARM Source Ext Id is empty OR Create Rev Plans on = Third Party Source Rev Rec Event Type - Billing OR (Create Rev Plans on = Third Party Billing AND Stamped Rev Rule = 100% on invoicing)
            //if (isEmpty(armSrcExtId) || (createRevPlansOn.createrevenueplanson[0].value == 5 || createRevPlansOn.createrevenueplanson[0].value != 3)){
            if (
                isEmpty(armSrcExtId) ||
                //       createRevPlansOn.createrevenueplanson[0].value == 5 ||
                (createRevPlansOn.createrevenueplanson[0].value == 5 &&	(lineItemRevenueRule == 14 || lineItemRevenueRule == 9))
            ) {
                log.debug('setting to false', lineItemRevenueRule);
                newRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'donotcreaterevenueelement',
                    line: i,
                    value: false
                });
            }

            //If Override Do Not Create Element is checked, check the box
            if (elmtOverride == true) {
                newRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'donotcreaterevenueelement',
                    line: i,
                    value: true
                });
            }

            var nativeCreateRevenueElement = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'donotcreaterevenueelement',
                line: i
            });

            log.debug('nativeCreateRevenueElement after processing line ' + i, nativeCreateRevenueElement);

            /*
                
                //if(createRevPlansOn.createrevenueplanson.length > 0) {
                if(!isEmpty(createRevPlansOn.createrevenueplanson)) {
                    if (createRevPlansOn.createrevenueplanson[0].value != 3) {

                        newRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'donotcreaterevenueelement',
                            line: i,
                            value: true
                        });

                        var nativeCreateRevenueElement = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'donotcreaterevenueelement',
                            line: i
                        });

                        log.debug('nativeCreateRevenueElement', nativeCreateRevenueElement)

                    }
                }
                
                */
            
            linesCounted = Number(linesCounted) + 1;
            log.debug('Governance After Line ' + linesCounted + ' Processed', script.getRemainingUsage());
            
        } //End for i loop

        log.audit('Do Not Create Revenue Element', 'END');

        log.audit('Check for Sync PDF to SF', 'START');

        var pdfExtId = newRecord.getValue('custbody_sf_pdf_ext_id');
        var currentPdfContent = newRecord.getValue(
            'custbody_pdf_base64_content'
        );
        var lastSentToSfPdfContent = newRecord.getValue(
            'custbody_last_pdfcontent_sent'
        );
        var syncPDFtoSF = newRecord.getValue('custbody_syncpdf_tosf');

        if (context.type == 'create') {
            if (
                !isEmpty(currentPdfContent) &&
                (currentPdfContent != lastSentToSfPdfContent ||
                    isEmpty(pdfExtId))
            ) {
                newRecord.setValue('custbody_syncpdf_tosf', true);
            }
        }

        if (context.type == 'edit') {
            var oldSyncPDFtoSF = newRecord.getValue('custbody_syncpdf_tosf');

            if (oldSyncPDFtoSF == true && syncPDFtoSF == false) {
                newRecord.setValue('custbody_syncpdf_tosf', false);
            } else {
                if (
                    !isEmpty(currentPdfContent) &&
                    (currentPdfContent != lastSentToSfPdfContent ||
                        isEmpty(pdfExtId))
                ) {
                    newRecord.setValue('custbody_syncpdf_tosf', true);
                }
            }
        }
        
        log.debug('Governance at End of Script', script.getRemainingUsage());

        log.audit('Check for Sync PDF to SF', 'END');
    }

    /**
     * @param {AfterSubmitContext} context
     * @return {void}
     */
    function afterSubmit(context) {
        try {
            log.audit('afterSubmit', {
                type: context.type,
                newRecord: {
                    type: context.newRecord.type,
                    id: context.newRecord.id
                }
                //oldRecord: {
                //  type: context.oldRecord.type,
                //  id: context.oldRecord.id,
                //},
            });
        } catch (e) {
            log.error('afterSubmit', JSON.parse(JSON.stringify(e)));
        }
    }

    function is_so_(context) {}

    function isEmpty(stValue) {
        return (
            stValue === '' ||
            stValue == null ||
            stValue == undefined ||
            (stValue.constructor === Array && stValue.length == 0) ||
            (stValue.constructor === Object &&
                (function (v) {
                    for (var k in v) return false;
                    return true;
                })(stValue))
        );
    }

    return {
        // beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
        // afterSubmit: afterSubmit,
    };
});
