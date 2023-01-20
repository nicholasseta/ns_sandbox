/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 *
 */

/**
 * SAAS CONSULTING GROUP, LLC CONFIDENTIAL
 * Copyright (C) 2022 SaaS Consulting Group, LLC.
 * All Rights Reserved.
 *
 * NOTICE:
 * All information contained herein is, and remains the property of SaaS Consulting Group, LLC.
 * The intellectual and technical concepts contained herein are proprietary to SaaS Consulting Group, LLC and
 * may be covered by U.S. and Foreign Patents, patents in process, and are protected by trade secret or copyright law.
 *
 * Author: Tommy Self
 * Created: 2023.01.12
 * Description: update revenue arrangement line field based on the custom order product record.
 *
 * Updated:
 * [YYYY.MM.DD] [Author] [Description]
 */
define(['N/record', 'N/runtime', 'N/search',"N/query"],
    /**

 */
    (record, runtime, search,query) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {

            try{

                log.audit({
                    title: 'getInputData',
                    details: 'Start getInputData'
                });


                // let searchId = runtime.getCurrentScript().getParameter({name: 'custscript_scg_order_products_search'})
                // let orderProductSearch = search.load({id: searchId})
                // return orderProductSearch.run().getRange(0,100);

                var sql =
                    `SELECT 
      RevenueElement.revenuearrangement.internalid as 'rev arr id', 
  CUSTOMRECORD_CONTRACTLINES.name as 'order product',
  CUSTOMRECORD_CONTRACTLINES.id as 'order product id',
  CUSTOMRECORD_CONTRACTLINES.custrecord_is_cl_sf_deal_id,
  RevenueElement.id as 'rev element id',
          CUSTOMRECORD_CONTRACTLINES.custrecord_cl_rev_arr_updated

      FROM
      CUSTOMRECORD_CONTRACTLINES,
          RevenueElement
      WHERE
      CUSTOMRECORD_CONTRACTLINES.custrecord_is_cl_revenue_element = RevenueElement."ID"(+) AND
      CUSTOMRECORD_CONTRACTLINES.custrecord_is_cl_sf_deal_id IS NOT NULL AND
      RevenueElement.id IS NOT NULL AND
      CUSTOMRECORD_CONTRACTLINES.custrecord_cl_rev_arr_updated = 'F'
      
       `;

                       // FETCH FIRST 10 ROWS ONLY

                let resultSet = [];

                //return query.runSuiteQL({ query: sql,  }).asMappedResults();


                let resultIterator = query.runSuiteQLPaged({ query: sql, pageSize: 1000 }).iterator();
                resultIterator.each(function (page) {
                    var pageIterator = page.value.data.iterator();
                    pageIterator.each(function (row) {
                        log.debug('result iterator',row.value);
                        let resultObj = {
                            'rev arr id': row.value.getValue(0),
                            'order product': row.value.getValue(1),
                            'order product id': row.value.getValue(2),
                            'custrecord_is_cl_sf_deal_id': row.value.getValue(3),
                            'rev element id': row.value.getValue(4),
                        }
                        resultSet.push(resultObj)

                        return true;
                    });

                    return true;
                });
                log.debug('result set',resultSet)

                return resultSet;
                //return query.runSuiteQLPaged({ query: sql, pageSize: 1000 }).iterator();



            }
            catch (e) {
                log.error({
                    title: 'getInputData error',
                    details: e
                })
            }


        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {

            try{
                log.debug({
                    title: 'map',
                    details: 'Start Map'
                });
                log.debug({
                    title: 'mapContext',
                    details: mapContext
                });

                let mapValue = JSON.parse(mapContext.value)
                log.debug({
                    title: 'mapContext value',
                    details: mapValue
                });

                // let mapKey = mapValue.id
                let mapKey = mapValue["rev arr id"]


                log.debug({
                    title: 'mapKey',
                    details: mapKey
                });

                mapContext.write(mapKey,mapValue);


                log.debug({
                    title: 'Map',
                    details: 'End Map'
                });

            }
            catch (e) {
                log.error({
                    title: 'map error',
                    details: e
                })
            }
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {

            try{
                log.debug({
                    title: 'Reduce',
                    details: 'Start Reduce'
                });

                log.debug({
                    title: 'Reduce',
                    details: reduceContext
                });

                let reduceValues = reduceContext.values;

                let firstVal = JSON.parse(reduceValues[0]);

                log.debug({
                    title: 'first reduce value',
                    details: firstVal
                });

                let revElementID = firstVal['rev element id'];

                log.debug({
                    title: 'rev element id',
                    details: revElementID
                })



                processRevArr(revElementID,reduceValues);

                // //search for rev arr ID based on element
                // const revenueelementInternalId = search.createColumn({ name: 'internalid' });
                // // const revenueelementSearchColNumber = search.createColumn({ name: 'recordnumber' });
                // // const revenueelementSearchColRevenueArrangement = search.createColumn({ name: 'revenuearrangement' });
                // const revenueelementSearchColRevenuearrangementInternalid = search.createColumn({ name: 'internalid', join: 'revenueArrangement' });
                // const revenueelementSearch = search.create({
                //     type: 'revenueelement',
                //     filters: [
                //         ['internalid', 'is', revElementID],
                //     ],
                //     columns: [
                //         revenueelementInternalId,
                //         // revenueelementSearchColNumber,
                //         // revenueelementSearchColRevenueArrangement,
                //         revenueelementSearchColRevenuearrangementInternalid
                //     ],
                // });
                //
                // let resultSet = revenueelementSearch.run().getRange({start: 0, end: 1});
                // if(resultSet[0]){
                //
                //     log.debug({
                //         title: 'rev arr result',
                //         details: resultSet[0]
                //     })
                //
                //     let revArrId = resultSet[0].getValue({
                //         name: 'internalid',
                //         join: 'revenueArrangement'
                //     })
                //     log.debug({
                //         title: 'rev Arr ID',
                //         details: revArrId
                //     })
                //
                //     let recRevArr = record.load({
                //         type: record.Type.REVENUE_ARRANGEMENT,
                //         id: revArrId
                //     })
                //
                //     //loop through all order product results
                //     //find the rev arr line number with the associated rev element
                //     //update line field
                //     //update order product record
                //
                //     for(let i = 0; i < reduceValues.length; i++){
                //
                //
                //         let reduceVal = JSON.parse(reduceValues[i]);
                //
                //         let revElementID = reduceVal.values['custrecord_is_cl_revenue_element'].value;
                //
                //         let lineNum = recRevArr.findSublistLineWithValue({
                //             sublistId: 'revenueelement',
                //             fieldId: 'revenueelement',
                //             value: revElementID
                //         })
                //
                //         log.debug({
                //             title: 'line number',
                //             details: 'rev element id: ' + revElementID + ' line: ' + lineNum
                //         });
                //
                //         //get custrecord_is_cl_sf_deal_id from reducevalues[i]
                //         let dealID = reduceVal.values['custrecord_is_cl_sf_deal_id'];
                //
                //
                //         recRevArr.setSublistValue({
                //             sublistId: 'revenueelement',
                //             fieldId: 'custcol_sf_deal_id_ra',
                //             line: lineNum,
                //             value: dealID
                //         })
                //
                //         let orderProductID = reduceVal.id;
                //
                //         record.submitFields({
                //             type: 'customrecord_contractlines',
                //             id: orderProductID,
                //             values: {
                //                 'custrecord_cl_rev_arr_updated': true
                //             }
                //         })
                //         log.audit({
                //             title: 'Order Product Processed',
                //             details: 'processed order product:' + orderProductID
                //         })
                //         //get id from reducevalues[i]
                //         //submit field - processed
                //
                //
                //     }
                //     recRevArr.save();
                //
                //     log.audit({
                //         title: 'Rev Arr Updated',
                //         details: 'saved revenuearrangement:' + recRevArr.id
                //     })
                //     //save record
                //
                //
                //
                //
                //
                // }






                log.debug({
                    title: 'Reduce',
                    details: 'End Reduce'
                });

            }
            catch (e) {

                log.error({
                    title: 'reduce error',
                    details: e
                })
            }
        }

        async function processRevArr(revElementID,reduceValues){

            // //search for rev arr ID based on element
            // const revenueelementInternalId = search.createColumn({ name: 'internalid' });
            // // const revenueelementSearchColNumber = search.createColumn({ name: 'recordnumber' });
            // // const revenueelementSearchColRevenueArrangement = search.createColumn({ name: 'revenuearrangement' });
            // const revenueelementSearchColRevenuearrangementInternalid = search.createColumn({ name: 'internalid', join: 'revenueArrangement' });
            // const revenueelementSearch = search.create({
            //     type: 'revenueelement',
            //     filters: [
            //         ['internalid', 'is', revElementID],
            //     ],
            //     columns: [
            //         revenueelementInternalId,
            //         // revenueelementSearchColNumber,
            //         // revenueelementSearchColRevenueArrangement,
            //         revenueelementSearchColRevenuearrangementInternalid
            //     ],
            // });
            //
            // let resultSet = revenueelementSearch.run().getRange({start: 0, end: 1});
            // if(resultSet[0]){

                // log.debug({
                //     title: 'rev arr ID',
                //     details: resultSet[0]
                // })
                //
                // let revArrId = resultSet[0].getValue({
                //     name: 'internalid',
                //     join: 'revenueArrangement'
                // })

                let revArrId = JSON.parse(reduceValues[0])['rev arr id'];


                log.debug({
                    title: 'rev Arr ID',
                    details: revArrId
                })

                let recRevArr = record.load({
                    type: record.Type.REVENUE_ARRANGEMENT,
                    id: revArrId
                })

                //loop through all order product results
                //find the rev arr line number with the associated rev element
                //update line field
                //update order product record

                for(let i = 0; i < reduceValues.length; i++){


                    let reduceVal = JSON.parse(reduceValues[i]);

                    let revElementID = reduceVal['rev element id'];

                    let lineNum = recRevArr.findSublistLineWithValue({
                        sublistId: 'revenueelement',
                        fieldId: 'revenueelement',
                        value: revElementID
                    })

                    log.debug({
                        title: 'line number',
                        details: 'rev element id: ' + revElementID + ' line: ' + lineNum
                    });

                    let dealID = reduceVal['custrecord_is_cl_sf_deal_id'];


                    recRevArr.setSublistValue({
                        sublistId: 'revenueelement',
                        fieldId: 'custcol_sf_deal_id_ra',
                        line: lineNum,
                        value: dealID
                    })

                    let orderProductID = reduceVal['order product id'];

                    record.submitFields({
                        type: 'customrecord_contractlines',
                        id: orderProductID,
                        values: {
                            'custrecord_cl_rev_arr_updated': true
                        }
                    })
                    log.audit({
                        title: 'Order Product Processed',
                        details: 'processed order product:' + orderProductID
                    })


                }
                recRevArr.save();

                log.audit({
                    title: 'Rev Arr Updated',
                    details: 'saved revenuearrangement:' + recRevArr.id
                })
                //save record





           // }

        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {

            log.audit({
                title: 'Summary',
                details: summaryContext
            });

        }

        return {getInputData, map, reduce, summarize}

    });
