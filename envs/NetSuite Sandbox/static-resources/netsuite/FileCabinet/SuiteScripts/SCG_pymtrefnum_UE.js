/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 */
    (record, search) => {

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            let newRec = scriptContext.newRecord;
            let invId = newRec.id;
            let recType = newRec.type;
            log.debug('recType', recType);
            let sub = newRec.getValue('subsidiary');
            let countryLookup = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: sub,
                columns: ['country']
            });
            let country = countryLookup.country[0].text;
            log.debug('country', country);
            //only run for finland
            if (country != 'Finland'){
                return;
            }
            //get invoice number
            let invNum = search.lookupFields({
                type: recType,
                id: invId,
                columns: ['tranid']
            });
            log.debug('invNum lookup', invNum);
            invNum = invNum.tranid;
            log.debug('tranid', invNum);
            let revInvNum = reverseString(invNum);
            log.debug('reverse invoice number', revInvNum);
            let appendNum = calculateRefNum(revInvNum);
            let pymtRefNum = invNum+appendNum;
            log.audit('invoice number with appended digit', pymtRefNum);
            record.submitFields({
                type: recType,
                id: newRec.id,
                values: {
                    'custbody_payment_reference_num': pymtRefNum
                }
            });
        }

        const reverseString = (str) => {
            // Step 1. Use the split() method to return a new array
            var splitString = str.split(""); // var splitString = "hello".split("");
            // ["h", "e", "l", "l", "o"]

            // Step 2. Use the reverse() method to reverse the new created array
            var reverseArray = splitString.reverse(); // var reverseArray = ["h", "e", "l", "l", "o"].reverse();
            // ["o", "l", "l", "e", "h"]

            // Step 3. Use the join() method to join all elements of the array into a string
            var joinArray = reverseArray.join(""); // var joinArray = ["o", "l", "l", "e", "h"].join("");
            // "olleh"

            //Step 4. Return the reversed string
            return joinArray; // "olleh"
        }

        const calculateRefNum = (revStr) => {
            const multiplier = [7, 3, 1];
            let repeatArr = repeat(multiplier, revStr.length);
            log.debug('repeat array', repeatArr);
            let sum = 0;
            for (var i = 0; i < revStr.length; i++){
                //multiple repeat array and rev string of same index
                log.debug('revStr['+i+']', revStr[i]);
                log.debug('repeatArr i', repeatArr[i]);
                sum += parseInt(revStr[i])*parseInt(repeatArr[i]);
            }
            log.debug('sum', sum);
            let roundedNum = roundUpNearest10(sum);
            let difference = roundedNum - sum;
            return difference;
        }

        const roundUpNearest10 = (num) => {
            return Math.ceil(num / 10) * 10;
        }

        const repeat = (arr, n) => Array.from({ length: arr.length * n }, (_, i) => arr[i % arr.length]);

        return {afterSubmit}

    });
