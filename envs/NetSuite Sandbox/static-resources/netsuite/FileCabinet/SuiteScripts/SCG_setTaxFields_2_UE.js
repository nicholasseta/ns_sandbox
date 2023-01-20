/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Version  Date            Author           Remark
 * 1.00     07 Sep 2021     Doug Humberd     Sets native tax fields from values sent over from SalesForce and stored in custom fields
 * 1.05     09 Sep 2021     Doug Humberd     Updated for Canada Tax Rate breakdown
 * 1.06     16 Sep 2021     Doug Humberd     Updated Canada logic to only split if MB, QC, BC, or SK
 * 1.10     01 Oct 2021     Doug Humberd     Removed Canada breakdown logic, breakdown to come directly from SF now
 * 1.15     07 Oct 2021     Doug Humberd     Modified Canada logic to use Ship State rather than Nexus
 * 1.20     14 Oct 2021     Doug Humberd     Updated to Fully Apply CM's (from SF) to the Invoice (as taxes are not currently being applied when originating from SF)
 * 1.21     09 Dec 2021     Doug Humberd     Per Matt, do not update tax rates on the line if SF Tax Rate is empty
 * 1.22     10 Dec 2021     Doug Humberd     Updated 'is_stf_fullyApplyCMtoInv' to also run on edit
 * 1.23     15 Dec 2021     Doug Humberd     Updated 'is_stf_setTaxFields' to no longer override total tax with 'SF Total Tax' amount (ok per Matt)
 * 1.24     22 Dec 2021     Matt Poloni      Updated 'isEmpty' to compare against '' via === to prevent false positives on values of 0
 * 1.25     13 Dec 2022     Doug Humberd     Updated 'is_stf_setTaxFields' for exception logic for Subsidiary: insightsoftware, LLC
 * 1.26     12 Jan 2023     Doug Humberd     Updated 'is_stf_setTaxFields' to not run if Data Migration is checked
 *
 *
 */
define(['N/record', 'N/search'],
	/**
	 * @param {record} record
	 * @param {search} search
	 */
	function(record, search) {

		//const MANITOBA = '9';//Nexus: Manitoba
		//const QUEBEC = '17';//Nexus: Quebec
		//const BRITISH_COLUMBIA = '8';//Nexus: British Columbia
		//const SASKATCHEWAN = '18';//Nexus: Saskatchewan
		const MANITOBA = 'MB';//Ship State: Manitoba
		const QUEBEC = 'QC';//Ship State: Quebec
		const BRITISH_COLUMBIA = 'BC';//Ship State: British Columbia
		const SASKATCHEWAN = 'SK';//Ship State: Saskatchewan
		const INSIGHTSOFTWARE_LLC = '10';//Subsidiary: insightsoftware, LLC


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
				is_stf_setTaxFields(context);
			}catch(e){
				is_stf_logError(e);
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
				is_stf_fullyApplyCMtoInv(context);
			}catch(e){
				is_stf_logError(e);
			}

		}





		function is_stf_setTaxFields(context){

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
			
			var dataMigration = rec.getValue({
				fieldId: 'custbody_data_migration'
			})
			log.debug('DataMigration', dataMigration);
			
			if (dataMigration == true){
				log.debug('Data Migration Checked', 'EXIT');
				return;
			}

			var subsidiary = rec.getValue({
				fieldId: 'subsidiary'
			});
			log.debug('Subsidiary', subsidiary);

			var nexusCountry = rec.getValue({
				fieldId: 'nexus_country'
			});
			log.debug('Nexus Country', nexusCountry);

			//var nexus = rec.getValue({
			//fieldId: 'nexus'
			//});
			//log.debug('Nexus', nexus);

			var shipState = rec.getValue({
				fieldId: 'shipstate'
			});
			log.debug('Ship State / Province', shipState);

			//*******************************************************************


			var sfTaxRate2;

			var sfTotalTax = rec.getValue({
				fieldId: 'custbody_scg_sf_total_tax'
			});
			log.debug('SF Total Tax', sfTotalTax);


			var itemCount = rec.getLineCount({
				sublistId: 'item'
			});

			for (var i = 0; i < itemCount; i++){

				var sfTaxRate = rec.getSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_scg_sf_tax_rate',
					line: i
				});
				log.debug('SF Tax Rate - Line ' + i, sfTaxRate);

				if (isEmpty(sfTaxRate)){
					continue;
					//sfTaxRate = 0;//REMOVED 12-9-21
				}

				//if (nexusCountry == 'CA'){
				//if (nexusCountry == 'CA' && (nexus == MANITOBA || nexus == QUEBEC || nexus == BRITISH_COLUMBIA || nexus == SASKATCHEWAN)){
				if (nexusCountry == 'CA' && (shipState == MANITOBA || shipState == QUEBEC || shipState == BRITISH_COLUMBIA || shipState == SASKATCHEWAN)){


					//Only Run if Nexus = MB (Manitoba), QC (Quebec), BC (British Columbia), or SK (Saskatchawan)
					//if (nexus != MANITOBA && nexus != QUEBEC && nexus != BRITISH_COLUMBIA && nexus != SASKATCHEWAN){
					//log.debug('Is Canada, but wrong Nexus', 'CONTINUE');
					//continue;
					//}


					//If Subsidiary = insightsoftware, LLC, Tax Rate 1 = 0, remaining to Tax Rate 2, else normal logic
					if (subsidiary == INSIGHTSOFTWARE_LLC){

						//Tax Rate 1 = 0, remaining to Tax Rate 2
						sfTaxRate2 = 0;

						log.debug('Set Tax Rate Line ' + i, sfTaxRate2);

						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'taxrate1',
							line: i,
							value: sfTaxRate2
						});

						log.debug('Set PST Line ' + i, sfTaxRate);

						rec.setSublistValue({
							sublistId: 'item',
							fieldId: 'taxrate2',
							line: i,
							value: sfTaxRate
						});

					}else{//subsidiary != INSIGHTSOFTWARE_LLC

						//Separate Tax Rate values.  Tax Rate 1 up to 5%, Tax Rate 2 is remaining, if any
						if (Number(sfTaxRate) <=5){

							sfTaxRate2 = 0;

							log.debug('Set Tax Rate Line ' + i, sfTaxRate);

							rec.setSublistValue({
								sublistId: 'item',
								fieldId: 'taxrate1',
								line: i,
								value: sfTaxRate
							});

							log.debug('Set PST Line ' + i, sfTaxRate2);

							rec.setSublistValue({
								sublistId: 'item',
								fieldId: 'taxrate2',
								line: i,
								value: sfTaxRate2
							});

						}else{

							//Separate Tax Rate Values
							sfTaxRate2 = Number(sfTaxRate) - 5;
							sfTaxRate = 5;

							log.debug('Set Tax Rate Line ' + i, sfTaxRate);

							rec.setSublistValue({
								sublistId: 'item',
								fieldId: 'taxrate1',
								line: i,
								value: sfTaxRate
							});

							log.debug('Set PST Line ' + i, sfTaxRate2);

							rec.setSublistValue({
								sublistId: 'item',
								fieldId: 'taxrate2',
								line: i,
								value: sfTaxRate2
							});

						}

						/*
                        //New Canada Logic (after Canada Breakdown removed
                        sfTaxRate2 = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_scg_sf_tax_rate2',
                            line: i
                        });
                        log.debug('SF Tax Rate 2 - Line ' + i, sfTaxRate);

                        if (isEmpty(sfTaxRate2)){
                            sfTaxRate2 = 0;
                        }


                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxrate1',
                            line: i,
                            value: sfTaxRate
                        });

                        log.debug('Set PST Line ' + i, sfTaxRate2);

                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxrate2',
                            line: i,
                            value: sfTaxRate2
                        });
                        //End New Canada Logic
                        */

					}//End subsidiary != INSIGHTSOFTWARE_LLC


				}else{

					log.debug('Set Tax Rate Line ' + i, sfTaxRate);

					rec.setSublistValue({
						sublistId: 'item',
						fieldId: 'taxrate1',
						line: i,
						value: sfTaxRate
					});

				}



			}//End for i loop


			//Removed with version 1.23
			/*

            //if (!isEmpty(sfTotalTax) && nexusCountry != 'CA'){
            //if (!isEmpty(sfTotalTax) && (nexusCountry != 'CA' || (nexusCountry == 'CA' && (nexus != MANITOBA && nexus != QUEBEC && nexus != BRITISH_COLUMBIA && nexus != SASKATCHEWAN)))){
            if (!isEmpty(sfTotalTax) && (nexusCountry != 'CA' || (nexusCountry == 'CA' && (shipState != MANITOBA && shipState != QUEBEC && shipState != BRITISH_COLUMBIA && shipState != SASKATCHEWAN)))){

                log.debug('Set Total Tax = ', sfTotalTax);

                rec.setValue({
                    fieldId: 'taxamountoverride',
                    value: sfTotalTax,
                    ignoreFieldChange: true
                });

              log.debug('after','after');

            }

            */


			//*******************************************************************


			/*

            //Load the Transaction Record
            var transactionRec = record.load({
                type: recType,
                id: recId,
                isDynamic: false,
            });


            var sfTotalTax = transactionRec.getValue({
                fieldId: 'custbody_scg_sf_total_tax'
            });
            log.debug('SF Total Tax', sfTotalTax);


            var itemCount = transactionRec.getLineCount({
                sublistId: 'item'
            });

            for (var i = 0; i < itemCount; i++){

                var sfTaxRate = transactionRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scg_sf_tax_rate',
                    line: i
                });
                log.debug('SF Tax Rate - Line ' + i, sfTaxRate);

                if (isEmpty(sfTaxRate)){
                    continue;
                }

                log.debug('Set Tax Rate Line ' + i, sfTaxRate);

                transactionRec.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'taxrate1',
                    line: i,
                    value: sfTaxRate
                });

            }//End for i loop


            if (!isEmpty(sfTotalTax)){

                log.debug('Set Total Tax = ', sfTotalTax);

                transactionRec.setValue({
                    fieldId: 'taxtotal',
                    value: sfTotalTax,
                    ignoreFieldChange: true
                });

            }


            transactionRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            */



		}






		function is_stf_fullyApplyCMtoInv(context){

			//Run on Create
			if (context.type != 'create' && context.type != 'edit'){//CHANGE OK PER MATT - FIXES TIMING ISSUE WITH MANUAL APPLYING CMs to INVs
				//if (context.type != 'create'){
				return;
			}

			log.debug('fullyApplyCMtoInv', 'START');

			var rec = context.newRecord;
			//log.debug('context.newRecord', rec);

			var recId = rec.id;
			//var recId = context.newRecord.id;
			var recType = rec.type;

			log.debug('Record Type = ' + recType, 'Record Id = ' + recId);

			var origSys = rec.getValue({
				fieldId: 'custbody_originating_system'
			});
			log.debug('Originating System', origSys);


			//Only Run on Credit Memos Originating from SF
			if (recType != 'creditmemo'){
				return;
			}

			if (origSys != '3'){//3 = Salesforce
				return;
			}


			var cmRec = record.load({
				type: 'creditmemo',
				id: recId,
				isDynamic: false
			});


			//Get CM Total
			var cmTotal = cmRec.getValue({
				fieldId: 'total'
			});
			log.debug('CM Total', cmTotal);


			//Apply to Invoice
			var applyCount = cmRec.getLineCount({
				sublistId: 'apply'
			});
			log.debug('applyCount', applyCount);


			for (var x = 0; x < applyCount; x++){

				var apply = cmRec.getSublistValue({
					sublistId: 'apply',
					fieldId: 'apply',
					line: x
				});

				if (apply == true){

					log.debug('Apply Line ' + x, apply);

					var amtDue = cmRec.getSublistValue({
						sublistId: 'apply',
						fieldId: 'due',
						line: x
					});
					log.debug('Amt Due Line ' + x, amtDue);

					var amtApplied = cmRec.getSublistValue({
						sublistId: 'apply',
						fieldId: 'amount',
						line: x
					});
					log.debug('Current Amount Applied Line ' + x, amtApplied);


					if (amtApplied == cmTotal){
						log.debug('CM is already fully applied', 'EXIT');
						break;
					}


					//If the CM Total Amount is > Amount Due, Recalculate Amount for Apply Line
					if (Number(cmTotal) > Number(amtDue)){

						log.debug('CM Total Amt > Amount Due', 'GREATER THAN');

						var newCMAmt = Number(amtDue);
						log.debug('Payment Net Amount > Amount Due', 'Recalculated Net Amount: ' + newCMAmt);

						cmRec.setSublistValue({
							sublistId: 'apply',
							fieldId: 'amount',
							line: x,
							value: newCMAmt
						});

					}else{//cmTotal <= amtDue

						log.debug('CM Total Amt <= Amount Due', 'LESS THAN or EQUAL');

						cmRec.setSublistValue({
							sublistId: 'apply',
							fieldId: 'amount',
							line: x,
							value: cmTotal
						});

					}//End if cmTotal <= amtDue


					//Save the CM
					log.debug('Save the CM', 'SAVE');
					var recordId = cmRec.save({
						enableSourcing: true,
						ignoreMandatoryFields: true
					});


					break;


				}//End if (apply == true)

			}//End for x loop

			log.debug('fullyApplyCMtoInv', 'END');

		}






		function isEmpty(stValue)
		{
			if ((stValue === '') || (stValue == null) ||(stValue == undefined))
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
function is_stf_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}



