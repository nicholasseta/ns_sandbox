function massDelete(rec_type, rec_id)
{
    try {
        nlapiDeleteRecord(rec_type, rec_id);
        nlapiLogExecution ('DEBUG', rec_id + ' was deleted successfully');
    } 
    catch(e) {
        nlapiLogExecution ('DEBUG', rec_id + ' was not deleted\n' + e);
    }
}