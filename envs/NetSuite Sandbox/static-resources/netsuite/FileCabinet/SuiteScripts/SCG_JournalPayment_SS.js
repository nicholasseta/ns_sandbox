/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       04 Sep 2019     Greg DelVecchio  Applies a single JE to a list of Invoices
 */

/**
 * Constants
 */
const JE_INTERNAL_ID = 6224630;

/**
 * Writes an error message to the Script Execution Log
 *
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 *
 * @returns {Void}
 */
function scg_jepymt_logError (e) {
  // Log the error based on available details
  var errorMessage = (e instanceof nlobjError) ? {
    'code': e.getCode(),
    'details': e.getDetails(),
    'stackTrace': e.getStackTrace(),
  } : {'code': '', 'details': e.toString(), 'stackTrace': ''}
  nlapiLogExecution('ERROR', 'System Error', JSON.stringify(errorMessage))
}

/**
 * Processes a list of records
 *
 * @appliedtorecord customerpayment
 *
 * @returns {void}
 */
function scg_jepymt_processList () {
  // Initialize variables
  var listRecords = scg_jepymt_getList()

  // Process the list of Expense Reports
  while (listRecords && listRecords.length > 0) {

    scg_jepymt_scheduledBatch(listRecords, function (listRecord) {
      try {
        scg_jepymt_applyJournalEntry(listRecord);
      } catch (e) {
        var errorMessage = (e instanceof nlobjError)
          ? {
            'code': e.getCode(),
            'details': e.getDetails(),
            'stackTrace': e.getStackTrace(),
          }
          : {
            'code': '',
            'details': e.toString(),
            'stackTrace': '',
          }
        nlapiLogExecution('ERROR', 'System Error',
          JSON.stringify(errorMessage, null, 4))
      }
    })

    // Check for any additional records
    listRecords = [];
  }
}

/**
 * Processes each element of an array, checks remaining governance units
 * and reschedules the script, if needed
 *
 * @param {Array} arr - The array to be processed by the script
 * @param {Object} proc - The function to be used to process each element of the array
 *
 * @returns {void}
 */
function scg_jepymt_scheduledBatch (arr, proc) {

  // Initialize variables
  var maxUsage = 0
  var startUsage = nlapiGetContext().getRemainingUsage()

  // Loop through the array
  for (var i in arr) {
    // Process the current array value
    proc(arr[i], i, arr)

    // Update the percent complete value on the script status page
    if (nlapiGetContext().getExecutionContext() ==
      'scheduled') nlapiGetContext().
      setPercentComplete(((100 * i) / arr.length).toFixed(1))

    // Track governance and reschedule script, if needed
    var endUsage = nlapiGetContext().getRemainingUsage()
    var runUsage = startUsage - endUsage
    if (maxUsage < runUsage) maxUsage = runUsage
    if (endUsage < (maxUsage + 20)) {
      var state = nlapiYieldScript()
      if (state.status == 'FAILURE') {
        nlapiLogExecution('ERROR',
          'Failed to reschedule script, exiting: Reason = ' + state.reason +
          ' / Size = ' + state.size + ' / Info = ' + state.information)
        throw 'Failed to reschedule script'
      } else if (state.status == 'RESUME') {
        nlapiLogExecution('AUDIT',
          'Resuming script because of ' + state.reason + '.  Size = ' +
          state.size)
      }
      startUsage = nlapiGetContext().getRemainingUsage()
    } else {
      startUsage = endUsage
    }
  }
}

/**
 * Returns a list of records to be processed
 *
 * @appliedtorecord customerpayment
 *
 * @returns {nlobjSearch}
 */
function scg_jepymt_getList () {
  // Initialize variables
  var invIds = [6191923,
                6223925,
                6224826,
                6224926,
                6225026,
                6224927,
                6225027,
                6224929,
                6225028,
                6224930,
                6225029,
                6224931,
                6224932,
                6225030,
                6224933,
                6225031,
                6224934,
                6224935,
                6225032,
                6224936,
                6225033,
                6224937,
                6224938,
                6225034,
                6224939,
                6225035,
                6224940,
                6224941,
                6225036,
                6224942,
                6225037,
                6224943,
                6224944,
                6225038,
                6224945,
                6225039,
                6224946,
                6224947,
                6225040,
                6224948,
                6224949,
                6225041,
                6224950,
                6225042,
                6224951,
                6224952,
                6225043,
                6225044,
                6224954,
                6225045,
                6224955,
                6225046,
                6224956,
                6224957,
                6224958,
                6225048,
                6224959,
                6224960,
                6225049,
                6224961,
                6225050,
                6224962,
                6225051,
                6224963,
                6224964,
                6225052,
                6225053,
                6224966,
                6224967,
                6225054,
                6224968,
                6225056,
                6224969,
                6224970,
                6224971,
                6225058,
                6225059,
                6224973,
                6225060,
                6224974,
                6224975,
                6225061,
                6224976,
                6225062,
                6224977,
                6224978,
                6225063,
                6224979,
                6224980,
                6224981,
                6225065,
                6224982,
                6225066,
                6224983,
                6225067,
                6224984,
                6224985,
                6225068,
                6224986,
                6225069,
                6224987,
                6224988,
                6225070,
                6224989,
                6225071,
                6224990,
                6224991,
                6224992,
                6225073,
                6224993,
                6224994,
                6225074,
                6224995,
                6225075,
                6224996,
                6225076,
                6224997,
                6225077,
                6224999,
                6225078,
                6225000,
                6225001,
                6225079,
                6225002,
                6225080,
                6225003,
                6225004,
                6225081,
                6225005,
                6225082,
                6225006,
                6225083,
                6225007,
                6225008,
                6225084,
                6225009,
                6225085,
                6225010,
                6225011,
                6225086,
                6225012,
                6225087,
                6225013,
                6225088,
                6225014,
                6225015,
                6225089,
                6225016,
                6225090,
                6225017,
                6225018,
                6225091,
                6225092,
                6225020,
                6225021,
                6225093,
                6225022,
                6225094,
                6225023,
                6225024,
                6225095,
                6225025,
                6225096,
                6225097,
                6227327,
                6225098,
                6227328,
                6227329,
                6227330,
                6227331,
                6225101,
                6227332,
                6227333,
                6225102,
                6227334,
                6225103,
                6227335,
                6225104,
                6227336,
                6227337,
                6225105,
                6227338,
                6225106,
                6227339,
                6225107,
                6227340,
                6225108,
                6227342,
                6225109,
                6227343,
                6225110,
                6227344,
                6227345,
                6225111,
                6227346,
                6225112,
                6225113,
                6227348,
                6225114,
                6227349,
                6227350,
                6225115,
                6227351,
                6225116,
                6227352,
                6225117,
                6227353,
                6227354,
                6225118,
                6227355,
                6225119,
                6225120,
                6225121,
                6225122,
                6225124,
                6227356,
                6227357,
                6225125,
                6227358,
                6227426,
                6227359,
                6227360,
                6227526,
                6227361,
                6227527,
                6227362,
                6227528,
                6227363,
                6227529,
                6227364,
                6227365,
                6227531,
                6227366,
                6227532,
                6227367,
                6227533,
                6227368,
                6227369,
                6227535,
                6227536,
                6227370,
                6227537,
                6227371,
                6227538,
                6227372,
                6227373,
                6227539,
                6227374,
                6227375,
                6227541,
                6227376,
                6227542,
                6227377,
                6227543,
                6227378,
                6227544,
                6227379,
                6227545,
                6227380,
                6227546,
                6227547,
                6227382,
                6227548,
                6227383,
                6227549,
                6227384,
                6227550,
                6227385,
                6227551,
                6227386,
                6227552,
                6227387,
                6227553,
                6227554,
                6227389,
                6227555,
                6227390,
                6227556,
                6227391,
                6227557,
                6227392,
                6227393,
                6227559,
                6227394,
                6227560,
                6227395,
                6227561,
                6227562,
                6227397,
                6227563,
                6227398,
                6227564,
                6227565,
                6227400,
                6227566,
                6227401,
                6227567,
                6227402,
                6227568,
                6227403,
                6227569,
                6227404,
                6227570,
                6227405,
                6227571,
                6227406,
                6227407,
                6227573,
                6227408,
                6227574,
                6227409,
                6227575,
                6227576,
                6227411,
                6227577,
                6227412,
                6227578,
                6227413,
                6227579,
                6227414,
                6227580,
                6227415,
                6227581,
                6227416,
                6227582,
                6227417,
                6227583,
                6227418,
                6227419,
                6227585,
                6227420,
                6227586,
                6227421,
                6227587,
                6227422,
                6227588,
                6227423,
                6227589,
                6227424,
                6227590,
                6227425,
                6227591,
                6227626,
                6227592,
                6227593,
                6227627,
                6227594,
                6227628,
                6227595,
                6227630,
                6227597,
                6227631,
                6227598,
                6227599,
                6227632,
                6227600,
                6227633,
                6227601,
                6227634,
                6227602,
                6227635,
                6227603,
                6227604,
                6227636,
                6227605,
                6227637,
                6227607,
                6227639,
                6227608,
                6227609,
                6227640,
                6227610,
                6227641,
                6227611,
                6227642,
                6227612,
                6227643,
                6227613,
                6227614,
                6227644,
                6227615,
                6227645,
                6227616,
                6227646,
                6227617,
                6227618,
                6227647,
                6227619,
                6227620,
                6227649,
                6227621,
                6227650,
                6227622,
                6227651,
                6227623,
                6227624,
                6227652,
                6227625,
                6227653,
                6227654,
                6227727,
                6227655,
                6227728,
                6227656,
                6227657,
                6227730,
                6227658,
                6227659,
                6227660,
                6227733,
                6227734,
                6227661,
                6227735,
                6227662,
                6227736,
                6227663,
                6227737,
                6227664,
                6227738,
                6227665,
                6227739,
                6227740,
                6227667,
                6227741,
                6227668,
                6227742,
                6227743,
                6227669,
                6227744,
                6227670,
                6227745,
                6227671,
                6227746,
                6227672,
                6227747,
                6227748,
                6227749,
                6227674,
                6227750,
                6227675,
                6227751,
                6227676,
                6227752,
                6227677,
                6227753,
                6227754,
                6227755,
                6227679,
                6227756,
                6227680,
                6227757,
                6227681,
                6227758,
                6227682,
                6227759,
                6227760,
                6227683,
                6227761,
                6227684,
                6227762,
                6227685,
                6227763,
                6227686,
                6227764,
                6227765,
                6227687,
                6227766,
                6227688,
                6227767,
                6227768,
                6227769,
                6227689,
                6227770,
                6227690,
                6227771,
                6227691,
                6227772,
                6227773,
                6227692,
                6227774,
                6227775,
                6227776,
                6227777,
                6227778,
                6227779,
                6227780,
                6227781,
                6227783,
                6227784,
                6227785,
                6227787,
                6227788,
                6227789,
                6227790,
                6227791,
                6227794
];
  return invIds;
}

/**
 * Applies a Journal Entry to an invoice
 *
 * @appliedtorecord journalentry
 *
 * @param {Integer} invId The internal id of an invoice record
 * @param {Integer} pymtId The internal id of credit memo record
 *
 * @returns {Boolean}
 */
function scg_jepymt_applyJournalEntry(invId) {

  // Transform the Invoice record to 'Accept Payments'
  var pymtRec = nlapiTransformRecord('invoice', invId, 'customerpayment', {recordmode: 'dynamic'});
  nlapiLogExecution('debug', 'Invoice is transformed to custpymt', pymtRec);

  var invoiceOpenAmt = parseFloat(pymtRec.getFieldValue('payment'));
  var totalJeAppliedAmt = 0;
  var creditCount = pymtRec.getLineItemCount('credit');
  var jeApplied = false;
  var status = false;

  nlapiLogExecution('debug', 'CustPymt Credit Count', creditCount);

  // If the creditCount is 0 then end the function
  if(creditCount == 0){
    nlapiLogExecution('error', 'Journal Entry not found on Credit tab of Customer Payment for Invoice ID: ', invId);
    return null;
  }

  // Loop through the credit lines
  for( var i = 1; !status && i <= creditCount; i++){

    pymtRec.selectLineItem('credit', i);

    // Check if the line item is a Journal entry
    var tranType = pymtRec.getCurrentLineItemValue('credit', 'trantype');
    if (tranType == 'Journal') {
      var jeId = pymtRec.getCurrentLineItemValue('credit', 'internalid');
      var customerId = pymtRec.getFieldValue('customer');
      nlapiLogExecution('debug', 'Ref Num for credit line', 'Tranid: ' + jeId + ' line number: ' + i);
      var isValidJe = (jeId == JE_INTERNAL_ID) ? true : false;

      // If the line is a journal entry then continue to apply the je
      //if(journal && journal.length > 0){
      if(isValidJe){
        nlapiLogExecution('DEBUG', 'Apply the je credit line', 'Line: ' + i);
        pymtRec.setCurrentLineItemValue('credit', 'apply', 'T');

        // Set credit to the amount remaining
        
        var amtRemaining = pymtRec.getCurrentLineItemValue('credit', 'due');
        var thisJeAppliedAmt = (amtRemaining >= invoiceOpenAmt) ? invoiceOpenAmt : amtRemaining;
        //pymtRec.setCurrentLineItemValue('credit', 'amount', thisJeAppliedAmt);
        
        // Commit the applied JE
        pymtRec.commitLineItem('credit');
        totalJeAppliedAmt += parseFloat(thisJeAppliedAmt);
        jeApplied = true;

        nlapiLogExecution('debug', 'Total JE Applied Amt: ' + totalJeAppliedAmt, 'This JE Applied Amt: ' + thisJeAppliedAmt);
        //if the Unapplied amount is greater than 0 then set status to true to end loop
        if(totalJeAppliedAmt == invoiceOpenAmt){
          status = true;
        }
        nlapiLogExecution('debug', 'Status', status);
      }
    }
  }

  // Abandon the Payment record if no JE has been applied
  if (!jeApplied) {
    nlapiLogExecution('error', 'Journal Entry not applied on Credit tab of Customer Payment for Invoice ID: ', invId);
    return;
  }

  // Find the current invoice on the Apply - Invoices tab and set the amount equal to the Total JE Applied Amount
  /*
  var invoiceLine = pymtRec.findLineItemValue('apply', 'apply', 'T');
  pymtRec.selectLineItem('apply', invoiceLine);
  pymtRec.setCurrentLineItemValue('apply', 'amount', totalJeAppliedAmt);
  pymtRec.commitLineItem('apply');

  // Set the Payment amount to zero
  pymtRec.setFieldValue('payment', 0);
  */
  // Submit the customer payment record
  var pymtId = nlapiSubmitRecord(pymtRec);
  nlapiLogExecution('debug', 'PymtId: ' + pymtId, '');

  return;
}
