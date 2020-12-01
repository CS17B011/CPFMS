const { localsName } = require('ejs');
const express = require('express');
const router = express.Router();
const getConnection = require('../../../connection');
const middleware = require('../../auth/auth_middleware');
const reportGenerator = require('./report_generator_module');

const beautifyDate = (date) => {
    var arr = date.split('-');
    var bdate = arr[2] + "/" + arr[1] + "/" + arr[0];
    return bdate;
}

// Listing Report

router.get('/accounthead', middleware.loggedin_as_superuser, (req, res) => {
    var headers = ["Sr.No.", "Society ID", "Society Name", "Village", "Taluka", "District"];
    var report_title = "Society List Report";
    var settings = {
        header_text_align_right: [1, 2],
        text_align_right: [1, 2]
    };
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql = `
                SET @count_accounthead:=0;
                SELECT
                    (@count_accounthead:=@count_accounthead+1) AS serial_number,
                    Account_Head.account_id,
                    Account_Head.account_name,
                    Account_Head.village_id,
                    Taluka.taluka_id,
                    District.district_id
                FROM Account_Head
                    INNER JOIN Village
                        ON Village.village_id = Account_Head.village_id
                    INNER JOIN Taluka
                        ON Taluka.taluka_id = Village.taluka_id
                    INNER JOIN District
                        ON District.district_id = Taluka.district_id
                ORDER BY Account_Head.account_id ASC;
            `;
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        settings,
                        datarows: results[1],
                        report_title,
                        date: sdate,
                        username
                    }
                    var template = "orders-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/talukalistsummary', middleware.loggedin_as_superuser, (req, res) => {
    var headers = ["Sr.No.", "Taluka ID", "Taluka Name", "No. of Societies", "No. of Members", "District ID"];
    var report_title = "Taluka List Report";
    var settings = {
        header_text_align_right: [1, 4, 5],
        text_align_right: [1, 4, 5]
    };
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql = `
                SET @count_taluka_list:=0;
                SELECT
                    (@count_taluka_list:=@count_taluka_list+1) AS serial_number,
                    X.taluka_id,
                    X.taluka_name,
                    X.account_id_count,
                    Y.sub_account_count,
                    X.district_id
                FROM
                    (
                        SELECT 
                            Taluka.*,
                            Count(DISTINCT Account_Balance.account_id) AS account_id_count
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id AND Account_Head.is_society = 1
                            INNER JOIN Village
                                ON Account_Head.village_id = Village.village_id
                            INNER JOIN Taluka
                                ON Village.taluka_id = Taluka.taluka_id
                        GROUP BY Taluka.taluka_id
                    ) AS X
                    INNER JOIN 
                        (
                            SELECT
                                Taluka.taluka_id,
                                Count(DISTINCT Account_Balance.sub_account_id) AS sub_account_count
                            FROM Account_Balance
                                INNER JOIN Account_Head
                                    ON Account_Balance.account_id = Account_Head.account_id AND Account_Head.is_society = 1
                                INNER JOIN Village
                                    ON Account_Head.village_id = Village.village_id
                                INNER JOIN Taluka
                                    ON Village.taluka_id = Taluka.taluka_id
                            GROUP BY Taluka.taluka_id
                        ) AS Y
                    ON  X.taluka_id = Y.taluka_id;
            `;
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        settings,
                        datarows: results[1],
                        report_title,
                        date: sdate,
                        username
                    }
                    var template = "orders-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/districtlistsummary', middleware.loggedin_as_superuser, (req, res) => {
    var headers = ["Sr.No.", "District ID", "District Name", "No. of Societies", "No. of Members"];
    var report_title = "District List Report";
    var settings = {
        header_text_align_right: [1, 4, 5],
        text_align_right: [1, 4, 5]
    };
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql = `
                SET @count_district_list:=0;
                SELECT
                    (@count_district_list:=@count_district_list+1) AS serial_number,
                    X.district_id,
                    X.district_name,
                    X.account_id_count,
                    Y.sub_account_count
                FROM
                    (
                        SELECT 
                            District.*,
                            Count(DISTINCT Account_Balance.account_id) AS account_id_count
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id AND Account_Head.is_society = 1
                            INNER JOIN Village
                                ON Account_Head.village_id = Village.village_id
                            INNER JOIN Taluka
                                ON Village.taluka_id = Taluka.taluka_id
                            INNER JOIN District
                                ON Taluka.district_id = District.district_id
                        GROUP BY District.district_id
                    ) AS X
                    INNER JOIN 
                        (
                            SELECT
                                District.district_id,
                                Count(DISTINCT Account_Balance.sub_account_id) AS sub_account_count
                            FROM Account_Balance
                                INNER JOIN Account_Head
                                    ON Account_Balance.account_id = Account_Head.account_id AND Account_Head.is_society = 1
                                INNER JOIN Village
                                    ON Account_Head.village_id = Village.village_id
                                INNER JOIN Taluka
                                    ON Village.taluka_id = Taluka.taluka_id
                                INNER JOIN District
                                    ON Taluka.district_id = District.district_id
                            GROUP BY District.district_id
                        ) AS Y
                    ON  X.district_id = Y.district_id;
            `;
            connection.query(sql, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        settings,
                        datarows: results[1],
                        report_title,
                        date: sdate,
                        username
                    }
                    var template = "orders-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/receiptlistsummary', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var headers = ["Sr.No.", "Date", "Document No.", "Receipt No.", "Society Name / Narration", "Receipt Amount"];
    var report_title = "Receipt List Report";
    var settings = {
        header_text_align_right: [],
        header_text_align_center: [],
        text_align_right: [],
        text_align_center: []
    };
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql = `
                SET @count_receipt_list:=0;
                SELECT
                    (@count_receipt_list:=@count_receipt_list+1) AS serial_number,
                    DATE_FORMAT(Receipt.receipt_date,'%d/%m/%Y') AS receipt_nice_date,
                    Receipt.document_number,
                    Receipt.receipt_number,
                    IF(Receipt.narration IS NULL OR Receipt.narration = '',Account_Head.account_name,CONCAT(Account_Head.account_name,"<br/>",Receipt.narration)),
                    Receipt.total_amount
                FROM Receipt
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Receipt.cr_account_id
                WHERE Receipt.receipt_date >= ? AND Receipt.receipt_date <= ?;
            `;
            connection.query(sql, [data.from_date, data.to_date], (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        datarows: results[1],
                        report_title,
                        date: sdate,
                        username
                    }
                    var template = "orders-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/paymentlistsummary', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var headers = ["Sr.No.", "Date", "Document No.", "Society Name / Narration", "Voucher Amount"];
    var report_title = "Payment List Report";
    var settings = {
        header_text_align_right: [],
        header_text_align_center: [],
        text_align_right: [],
        text_align_center: []
    };
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql = `
                SET @count_payment_list:=0;
                SELECT
                    (@count_payment_list:=@count_payment_list+1) AS serial_number,
                    DATE_FORMAT(Payment.voucher_date,'%d/%m/%Y') AS payment_nice_date,
                    Payment.document_number,
                    IF(Payment.narration IS NULL OR Payment.narration = '',Account_Head.account_name,CONCAT(Account_Head.account_name,"<br/>",Payment.narration)),
                    Payment.total_amount
                FROM Payment
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Payment.dr_account_id
                WHERE Payment.voucher_date >= ? AND Payment.voucher_date <= ?;
            `;
            connection.query(sql, [data.from_date, data.to_date], (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        datarows: results[1],
                        report_title,
                        date: sdate,
                        username
                    }
                    var template = "orders-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/rpsummary', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var headers = ["Sr.No.", "RP ID", "RP Name", "Joint", "Cancel", "Death", "Net", "Heifer", "Calwing"];
    var settings = {
        header_text_align_right: [1, 4, 5, 6, 7, 8, 9],
        header_text_align_center: [2],
        text_align_right: [1, 4, 5, 6, 7, 8, 9],
        text_align_center: [2]
    };
    var report_title = "Resource Person Wise Summary Report";
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date];
                sql = `
                    SELECT 
                        DISTINCT Account_Balance.resource_person_id AS rpid,
                        Resource_Person.resource_person_name,
                        (
                            SELECT COUNT(Account_Balance.join_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        ) AS x,
                        (
                            SELECT COUNT(Account_Balance.cancel_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.cancel_date >= ? AND Account_Balance.cancel_date <= ?
                        ) AS y,
                        (
                            SELECT COUNT(Account_Balance.death_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.death_date >= ? AND Account_Balance.death_date <= ?
                        ) AS z,
                        (
                            SELECT COUNT(Account_Balance.heifer_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.heifer_date >= ? AND Account_Balance.heifer_date <= ?
                        ) AS a,
                        (
                            SELECT COUNT(Account_Balance.calwing_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.calwing_date >= ? AND Account_Balance.calwing_date <= ?
                        ) AS b
                    FROM Account_Balance
                        INNER JOIN Resource_Person
                            ON Resource_Person.resource_person_id = Account_Balance.resource_person_id
                    ORDER BY Account_Balance.resource_person_id ASC;
                `;
            }
            else {
                sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date, data.from_date, data.to_date, data.rp_id_list];
                sql = `
                    SELECT 
                        DISTINCT Account_Balance.resource_person_id AS rpid,
                        Resource_Person.resource_person_name,
                        (
                            SELECT COUNT(Account_Balance.join_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        ) AS x,
                        (
                            SELECT COUNT(Account_Balance.cancel_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.cancel_date >= ? AND Account_Balance.cancel_date <= ?
                        ) AS y,
                        (
                            SELECT COUNT(Account_Balance.death_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.death_date >= ? AND Account_Balance.death_date <= ?
                        ) AS z,
                        (
                            SELECT COUNT(Account_Balance.heifer_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.heifer_date >= ? AND Account_Balance.heifer_date <= ?
                        ) AS a,
                        (
                            SELECT COUNT(Account_Balance.calwing_date) FROM Account_Balance WHERE Account_Balance.resource_person_id = rpid AND Account_Balance.calwing_date >= ? AND Account_Balance.calwing_date <= ?
                        ) AS b
                    FROM Account_Balance
                        INNER JOIN Resource_Person
                            ON Resource_Person.resource_person_id = Account_Balance.resource_person_id
                    WHERE Account_Balance.resource_person_id IN (?)
                    ORDER BY Account_Balance.resource_person_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], data_global_total;

                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                    }
                    else {
                        var data_entry = [], single_entry, data_counter = 1, entry, net = 0, jtotal = 0, ctotal = 0, dtotal = 0, ntotal = 0, htotal = 0, caltotal = 0;

                        // DataRows Generation
                        for (item of results) {
                            net = parseInt(item.x) - (parseInt(item.y) + parseInt(item.z));
                            single_entry = {
                                snum: data_counter,
                                rpid: item.rpid,
                                rpname: item.resource_person_name,
                                join: item.x,
                                cancel: item.y,
                                death: item.z,
                                net,
                                hf: item.a,
                                cal: item.b
                            };
                            jtotal += parseInt(single_entry.join);
                            ctotal += parseInt(single_entry.cancel);
                            dtotal += parseInt(single_entry.death);
                            ntotal += net;
                            htotal += parseInt(single_entry.hf);
                            caltotal += parseInt(single_entry.cal);
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        var data_total = `
                            <tr style="background-color: gray;text-align: center;width:100%">
                                <td></td>
                                <td colspan="2"><strong>Total</strong></td>
                                <td><strong>${jtotal}</strong></td>
                                <td><strong>${ctotal}</strong></td>
                                <td><strong>${dtotal}</strong></td>
                                <td><strong>${ntotal}</strong></td>
                                <td><strong>${htotal}</strong></td>
                                <td><strong>${caltotal}</strong></td>
                            </tr>
                        `;
                        entry = {
                            data: data_entry,
                            data_total
                        }
                        datarows.push(entry);
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    dataobject.datarows = datarows;
                    dataobject.data_global_total = data_global_total;
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

// Details Report

router.get('/accountheaddetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        header_text_align_right: [1, 6],
        header_text_align_center: [4],
        text_align_right: [1, 6],
        text_align_center: [4],
        summary_text_align_right: [1, 4, 5],
        summary_header_text_align_right: [1, 4, 5]
    };
    var headers;
    var summary_headers;
    var report_title = "Society-Member Detail Report";
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Join Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Join Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, flag = false, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date];
                if (data.show_balance == '1') {
                    flag = true;
                    sql = `
                        SELECT 
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            Account_Balance.resource_person_id,
                            Account_Balance.sub_account_id,
                            Sub_Account.sub_account_name,
                            DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                            Account_Balance.cl_crdr,
                            Account_Balance.cl_balance
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id 
                            INNER JOIN Sub_Account
                                ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                        WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        ORDER BY Account_Balance.account_id ASC;
                        SELECT
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            COUNT(Account_Balance.sub_account_id) AS total_members
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id
                        WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        GROUP BY Account_Balance.account_id
                        ORDER BY Account_Balance.account_id ASC;
                    `;
                }
                else {
                    sql = `
                        SELECT 
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            Account_Balance.sub_account_id,
                            Account_Balance.resource_person_id,
                            Sub_Account.sub_account_name,
                            DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id
                            INNER JOIN Sub_Account
                                ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                        WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        ORDER BY Account_Balance.account_id ASC;
                        SELECT
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            COUNT(Account_Balance.sub_account_id) AS total_members
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id
                        WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        GROUP BY Account_Balance.account_id
                        ORDER BY Account_Balance.account_id ASC;
                    `;
                }
            }
            else {
                sql_arr = [data.account_id_list, data.from_date, data.to_date, data.account_id_list, data.from_date, data.to_date];
                if (data.show_balance == '1') {
                    flag = true;
                    sql = `
                        SELECT 
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            Account_Balance.resource_person_id,
                            Account_Balance.sub_account_id,
                            Sub_Account.sub_account_name,
                            DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                            Account_Balance.cl_crdr,
                            Account_Balance.cl_balance
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id 
                            INNER JOIN Sub_Account
                                ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                        WHERE Account_Balance.account_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        ORDER BY Account_Balance.account_id ASC;
                        SELECT
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            COUNT(Account_Balance.sub_account_id) AS total_members
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id
                        WHERE Account_Balance.account_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        GROUP BY Account_Balance.account_id
                        ORDER BY Account_Balance.account_id ASC;
                    `;
                }
                else {
                    sql = `
                        SELECT 
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            Account_Balance.sub_account_id,
                            Account_Balance.resource_person_id,
                            Sub_Account.sub_account_name,
                            DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id
                            INNER JOIN Sub_Account
                                ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                        WHERE Account_Balance.account_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        ORDER BY Account_Balance.account_id ASC;
                        SELECT
                            Account_Balance.account_id,
                            Account_Head.account_name,
                            COUNT(Account_Balance.sub_account_id) AS total_members
                        FROM Account_Balance
                            INNER JOIN Account_Head
                                ON Account_Balance.account_id = Account_Head.account_id
                        WHERE Account_Balance.account_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                        GROUP BY Account_Balance.account_id
                        ORDER BY Account_Balance.account_id ASC;
                    `;
                }
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;

                    if (flag == true) {
                        headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person", "Account Balance"];
                        summary_headers = ["Sr.No.", "Society ID", "Society Name", "Members", "Balance"];
                        if (results[0].length <= 0) {
                            datarows = [];
                            summary = [];
                            data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;0</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;0</strong></td>
                                </tr>
                            `;
                        }
                        else {
                            var curr_id = results[0][0].account_id, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0][0].account_id + " - " + results[0][0].account_name, entry, total_balance = 0.00, curr_balance = 0.00, total_balance_arr = [], data_total_str = ``, data_total_crdr = '';

                            // DataRows Generation with balance
                            for (item of results[0]) {
                                new_id = item.account_id;
                                if (curr_id != new_id) {
                                    data_counter = 1;
                                    data_total_crdr = total_balance >= 0 ? "CR" : "DR";
                                    data_total_str = `
                                    <tr style="text-align: center;border-top: 2px solid black;border-bottom: 2px solid black;background-color: white;">
                                        <td></td>
                                        <td colspan="3"><strong>Total</strong></td>
                                        <td colspan="2" style="text-align: right;"><strong>${Math.abs(total_balance).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " " + data_total_crdr}</strong></td>
                                    </tr>
                                `;
                                    entry = {
                                        data_title: sub_title,
                                        data: data_entry,
                                        data_total: data_total_str
                                    }
                                    datarows.push(entry);
                                    sub_title = item.account_id + " - " + item.account_name;
                                    curr_id = new_id;
                                    data_entry = [];
                                    total_balance_arr.push(total_balance);
                                    total_balance = 0.00;
                                }
                                curr_balance = item.cl_crdr.toUpperCase() == 'CR' ? parseFloat(item.cl_balance) : -1 * parseFloat(item.cl_balance);
                                total_balance += curr_balance;
                                single_entry = {
                                    snum: data_counter,
                                    mid: item.sub_account_id,
                                    mname: item.sub_account_name,
                                    jdate: item.join_date,
                                    rp: item.resource_person_id,
                                    abalance: parseFloat(item.cl_balance).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " " + item.cl_crdr
                                };
                                data_entry.push(single_entry);
                                data_counter++;
                            }
                            data_total_crdr = total_balance >= 0 ? "CR" : "DR";
                            data_total_str = `
                                <tr style="text-align: center;border-top: 2px solid black;border-bottom: 2px solid black;background-color: white;">
                                    <td></td>
                                    <td colspan="3"><strong>Total</strong></td>
                                    <td colspan="2" style="text-align: right;"><strong>${Math.abs(total_balance).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " " + data_total_crdr}</strong></td>
                                </tr>
                            `;
                            entry = {
                                data_title: sub_title,
                                data: data_entry,
                                data_total: data_total_str
                            }
                            total_balance_arr.push(total_balance);
                            datarows.push(entry);

                            // Summary Generation with balance
                            var summary_counter = 0, total_balance_crdr, final_total_balance = 0.00, final_total_members = 0, final_total_balance_crdr;
                            summary.summary_headers = summary_headers;
                            summary.summary_len = summary_headers.length;
                            summary.summary_data = [];
                            for (item of results[1]) {
                                total_balance = total_balance_arr[summary_counter];
                                final_total_balance += total_balance;
                                total_balance_crdr = total_balance >= 0 ? "CR" : "DR";
                                summary_counter++;
                                entry = {
                                    snum: summary_counter,
                                    scode: item.account_id,
                                    sname: item.account_name,
                                    tm: item.total_members,
                                    tb: Math.abs(total_balance).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " " + total_balance_crdr
                                }
                                final_total_members += parseInt(entry.tm);
                                summary.summary_data.push(entry);
                            }
                            final_total_balance_crdr = final_total_balance >= 0 ? "CR" : "DR";
                            summary.summary_total = `
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Total</strong></td>
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
                                    <td style="text-align: right;">${Math.abs(final_total_balance).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " " + final_total_balance_crdr}</td>
                                </tr>
                            `;
                            data_global_total = `
                                <tr style="background-color: gray;text-align: center;">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;${results[1].length}</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;${final_total_members}</strong></td>
                                    <td><strong>Total Balance&nbsp;:&nbsp;&nbsp;${Math.abs(final_total_balance).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " " + final_total_balance_crdr}</strong></td>
                                </tr>
                            `;
                        }
                    }
                    else {
                        headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person"];
                        summary_headers = ["Sr.No.", "Society ID", "Society Name", "Members"];
                        if (results[0].length <= 0) {
                            datarows = [];
                            summary = [];
                            data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;0</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;0</strong></td>
                                </tr>
                            `;
                        }
                        else {
                            var curr_id = results[0][0].account_id, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0][0].account_id + " - " + results[0][0].account_name, entry;

                            // DataRows Generation with balance
                            for (item of results[0]) {
                                new_id = item.account_id;
                                if (curr_id != new_id) {
                                    data_counter = 1;
                                    entry = {
                                        data_title: sub_title,
                                        data: data_entry
                                    }
                                    datarows.push(entry);
                                    sub_title = item.account_id + " - " + item.account_name;
                                    curr_id = new_id;
                                    data_entry = [];
                                }
                                single_entry = {
                                    snum: data_counter,
                                    mid: item.sub_account_id,
                                    mname: item.sub_account_name,
                                    jdate: item.join_date,
                                    rp: item.resource_person_id,
                                };
                                data_entry.push(single_entry);
                                data_counter++;
                            }
                            entry = {
                                data_title: sub_title,
                                data: data_entry
                            }
                            datarows.push(entry);

                            // Summary Generation with balance
                            var summary_counter = 0, final_total_members = 0;
                            summary.summary_headers = summary_headers;
                            summary.summary_len = summary_headers.length;
                            summary.summary_data = [];
                            for (item of results[1]) {
                                summary_counter++;
                                entry = {
                                    snum: summary_counter,
                                    scode: item.account_id,
                                    sname: item.account_name,
                                    tm: item.total_members
                                }
                                final_total_members += parseInt(entry.tm);
                                summary.summary_data.push(entry);
                            }
                            summary.summary_total = `
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Total</strong></td>
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
                                </tr>
                            `;
                            data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;${results[1].length}</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;${final_total_members}</strong></td>
                                </tr>
                            `;
                        }
                    }
                    var username = req.user.user_name;

                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    if (data.show_balance == '1') {
                        dataobject.sub_title_1 = "With Balance"
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/cowcastdetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        header_text_align_right: [1],
        header_text_align_center: [4, 5],
        text_align_right: [1],
        text_align_center: [4, 5],
        summary_header_text_align_right: [1, 4],
        summary_text_align_right: [1, 4]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
    var report_title = "Cow Cast Wise Society Detail Report";
    var cow_cast_list;
    if (data.select_all == '1')
        cow_cast_list = 'All';
    else {
        if ("cowcast_id_list" in data) {
            if (typeof (data.cowcast_id_list) === 'string')
                cow_cast_list = data.cowcast_id_list
            else
                cow_cast_list = data.cowcast_id_list.join(', ');
        }
        else
            cow_cast_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Join Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Join Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Cow Cast</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${cow_cast_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            else {
                sql_arr = [data.cowcast_id_list, data.from_date, data.to_date, data.cowcast_id_list, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.cow_cast_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Balance.cow_cast_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;

                    if (results[0].length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;0</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;0</strong></td>
                                </tr>
                            `;
                    }
                    else {
                        var curr_id = results[0][0].account_id, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0][0].account_id + " - " + results[0][0].account_name, entry;

                        // DataRows Generation with balance
                        for (item of results[0]) {
                            new_id = item.account_id;
                            if (curr_id != new_id) {
                                data_counter = 1;
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry
                                }
                                datarows.push(entry);
                                sub_title = item.account_id + " - " + item.account_name;
                                curr_id = new_id;
                                data_entry = [];
                            }
                            single_entry = {
                                snum: data_counter,
                                mid: item.sub_account_id,
                                mname: item.sub_account_name,
                                jdate: item.join_date,
                                rp: item.resource_person_id,
                            };
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        entry = {
                            data_title: sub_title,
                            data: data_entry
                        }
                        datarows.push(entry);

                        // Summary Generation with balance
                        var summary_counter = 0, final_total_members = 0;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];
                        for (item of results[1]) {
                            summary_counter++;
                            entry = {
                                snum: summary_counter,
                                scode: item.account_id,
                                sname: item.account_name,
                                tm: item.total_members
                            }
                            final_total_members += parseInt(entry.tm);
                            summary.summary_data.push(entry);
                        }
                        summary.summary_total = `
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td style="text-align: center;" colspan="2"><strong>Total</strong></td>
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
                                </tr>
                            `;
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;${results[1].length}</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;${final_total_members}</strong></td>
                                </tr>
                            `;
                    }
                    var username = req.user.user_name;

                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/organizationdetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        header_text_align_right: [1, 5],
        header_text_align_center: [4],
        text_align_right: [1, 5],
        text_align_center: [4],
        summary_text_align_right: [1, 4],
        summary_header_text_align_right: [1, 4]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
    var report_title = "Organization Wise Society Detail Report";
    var org_list;
    if (data.select_all == '1')
        org_list = 'All';
    else {
        if ("org_id_list" in data) {
            if (typeof (data.org_id_list) === 'string')
                org_list = data.org_id_list
            else
                org_list = data.org_id_list.join(', ');
        }
        else
            org_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Join Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Join Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Organization</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${org_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            else {
                sql_arr = [data.org_id_list, data.from_date, data.to_date, data.org_id_list, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.organization_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Balance.organization_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;

                    if (results[0].length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;0</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;0</strong></td>
                                </tr>
                            `;
                    }
                    else {
                        var curr_id = results[0][0].account_id, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0][0].account_id + " - " + results[0][0].account_name, entry;

                        // DataRows Generation with balance
                        for (item of results[0]) {
                            new_id = item.account_id;
                            if (curr_id != new_id) {
                                data_counter = 1;
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry
                                }
                                datarows.push(entry);
                                sub_title = item.account_id + " - " + item.account_name;
                                curr_id = new_id;
                                data_entry = [];
                            }
                            single_entry = {
                                snum: data_counter,
                                mid: item.sub_account_id,
                                mname: item.sub_account_name,
                                jdate: item.join_date,
                                rp: item.resource_person_id,
                            };
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        entry = {
                            data_title: sub_title,
                            data: data_entry
                        }
                        datarows.push(entry);

                        // Summary Generation with balance
                        var summary_counter = 0, final_total_members = 0;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];
                        for (item of results[1]) {
                            summary_counter++;
                            entry = {
                                snum: summary_counter,
                                scode: item.account_id,
                                sname: item.account_name,
                                tm: item.total_members
                            }
                            final_total_members += parseInt(entry.tm);
                            summary.summary_data.push(entry);
                        }
                        summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td></td>
                                    <td colspan="2"><strong>Total</strong></td>
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
                                </tr>
                            `;
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;${results[1].length}</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;${final_total_members}</strong></td>
                                </tr>
                            `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/rpdetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        header_text_align_right: [1, 4],
        header_text_align_center: [4],
        text_align_right: [1, 4],
        text_align_center: [4],
        summary_text_align_right: [1, 4, 5],
        summary_header_text_align_right: [1, 4, 5]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "RP ID"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
    var report_title = "Resource Person Wise Detail Report";
    var rp_list;
    if (data.select_all == '1')
        rp_list = 'All';
    else {
        if ("rp_id_list" in data) {
            if (typeof (data.rp_id_list) === 'string')
                rp_list = data.rp_id_list
            else
                rp_list = data.rp_id_list.join(', ');
        }
        else
            rp_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Join Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Join Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Resource Person</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${rp_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            else {
                sql_arr = [data.rp_id_list, data.from_date, data.to_date, data.rp_id_list, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.resource_person_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Balance.resource_person_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    if (results[0].length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;0</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;0</strong></td>
                                </tr>
                            `;
                    }
                    else {
                        var curr_id = results[0][0].account_id, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0][0].account_id + " - " + results[0][0].account_name, entry;

                        // DataRows Generation with balance
                        for (item of results[0]) {
                            new_id = item.account_id;
                            if (curr_id != new_id) {
                                data_counter = 1;
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry
                                }
                                datarows.push(entry);
                                sub_title = item.account_id + " - " + item.account_name;
                                curr_id = new_id;
                                data_entry = [];
                            }
                            single_entry = {
                                snum: data_counter,
                                mid: item.sub_account_id,
                                mname: item.sub_account_name,
                                jdate: item.join_date,
                                rp: item.resource_person_id,
                            };
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        entry = {
                            data_title: sub_title,
                            data: data_entry
                        }
                        datarows.push(entry);

                        // Summary Generation with balance
                        var summary_counter = 0, final_total_members = 0;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];
                        for (item of results[1]) {
                            summary_counter++;
                            entry = {
                                snum: summary_counter,
                                scode: item.account_id,
                                sname: item.account_name,
                                tm: item.total_members
                            }
                            final_total_members += parseInt(entry.tm);
                            summary.summary_data.push(entry);
                        }
                        summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td></td>
                                    <td colspan="2"><strong>Total</strong></td>
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
                                </tr>
                            `;
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;${results[1].length}</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;${final_total_members}</strong></td>
                                </tr>
                            `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/insurancedetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 4, 5],
        header_text_align_right: [1, 4, 5],
        summary_text_align_right: [1, 4, 5],
        summary_header_text_align_right: [1, 4, 5]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Insurance Date", "Tag No.", "Next Due On"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
    var report_title = "Insurance Detail Report";
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Insurance Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Insurance Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date];
            sql = `
                SELECT
                    Account_Balance.account_id,
                    Account_Head.account_name,
                    Account_Balance.sub_account_id,
                    Sub_Account.sub_account_name,
                    DATE_FORMAT(Account_Balance.insurance_date,'%d/%m/%Y') AS join_date,
                    IF(Account_Balance.insurance_tag_no IS NULL,"",Account_Balance.insurance_tag_no) AS tag_no,
                    DATE_FORMAT(Account_Balance.insurance_due_on_date,'%d/%m/%Y') AS due_date
                FROM Account_Balance
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Account_Balance.account_id
                    INNER JOIN Sub_Account
                        ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                WHERE Account_Balance.insurance_date >= ? AND Account_Balance.insurance_date <= ?
                ORDER BY Account_Balance.account_id ASC;
                SELECT
                    Account_Balance.account_id,
                    Account_Head.account_name,
                    Count(Account_Balance.sub_account_id) AS total_members
                FROM Account_Balance
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Account_Balance.account_id
                WHERE Account_Balance.insurance_date >= ? AND Account_Balance.insurance_date <= ?
                GROUP BY Account_Balance.account_id
                ORDER BY Account_Balance.account_id ASC;
            `;
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;

                    if (results[0].length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;0</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;0</strong></td>
                                </tr>
                            `;
                    }
                    else {
                        var curr_id = results[0][0].account_id, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0][0].account_id + " - " + results[0][0].account_name, entry;

                        // DataRows Generation with balance
                        for (item of results[0]) {
                            new_id = item.account_id;
                            if (curr_id != new_id) {
                                data_counter = 1;
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry
                                }
                                datarows.push(entry);
                                sub_title = item.account_id + " - " + item.account_name;
                                curr_id = new_id;
                                data_entry = [];
                            }
                            single_entry = {
                                snum: data_counter,
                                mid: item.sub_account_id,
                                mname: item.sub_account_name,
                                jdate: item.join_date,
                                tnum: item.tag_no,
                                rp: item.due_date
                            };
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        entry = {
                            data_title: sub_title,
                            data: data_entry
                        }
                        datarows.push(entry);

                        // Summary Generation with balance
                        var summary_counter = 0, final_total_members = 0;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];
                        for (item of results[1]) {
                            summary_counter++;
                            entry = {
                                snum: summary_counter,
                                scode: item.account_id,
                                sname: item.account_name,
                                tm: item.total_members
                            }
                            final_total_members += parseInt(entry.tm);
                            summary.summary_data.push(entry);
                        }
                        summary.summary_total = `
                                <tr style="text-align: center;background-color: gray;">
                                    <td></td>
                                    <td colspan="2"><strong>Total</strong></td>
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
                                </tr>
                            `;
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;${results[1].length}</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;${final_total_members}</strong></td>
                                </tr>
                            `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/talukadetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 2, 5],
        header_text_align_right: [1, 2, 5],
        text_align_center: [4],
        header_text_align_center: [4],
        summary_text_align_right: [1, 2, 4],
        summary_header_text_align_right: [1, 2, 4],
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
    var report_title = "Taluka Wise Society Detail Report";
    var taluka_list;
    if (data.select_all == '1')
        taluka_list = 'All';
    else {
        if ("taluka_id_list" in data) {
            if (typeof (data.taluka_id_list) === 'string')
                taluka_list = data.taluka_id_list
            else
                taluka_list = data.taluka_id_list.join(', ');
        }
        else
            taluka_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Join Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Join Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Taluka</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${taluka_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            else {
                sql_arr = [data.taluka_id_list, data.from_date, data.to_date, data.taluka_id_list, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                        INNER JOIN Village
                            ON Account_Head.village_id = Village.village_id
                        INNER JOIN Taluka
                            ON Village.taluka_id = Taluka.taluka_id
                    WHERE Taluka.taluka_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Village
                            ON Account_Head.village_id = Village.village_id
                        INNER JOIN Taluka
                            ON Village.taluka_id = Taluka.taluka_id
                    WHERE Taluka.taluka_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    if (results[0].length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;0</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;0</strong></td>
                                </tr>
                            `;
                    }
                    else {
                        var curr_id = results[0][0].account_id, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0][0].account_id + " - " + results[0][0].account_name, entry;

                        // DataRows Generation with balance
                        for (item of results[0]) {
                            new_id = item.account_id;
                            if (curr_id != new_id) {
                                data_counter = 1;
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry
                                }
                                datarows.push(entry);
                                sub_title = item.account_id + " - " + item.account_name;
                                curr_id = new_id;
                                data_entry = [];
                            }
                            single_entry = {
                                snum: data_counter,
                                mid: item.sub_account_id,
                                mname: item.sub_account_name,
                                jdate: item.join_date,
                                rp: item.resource_person_id,
                            };
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        entry = {
                            data_title: sub_title,
                            data: data_entry
                        }
                        datarows.push(entry);

                        // Summary Generation with balance
                        var summary_counter = 0, final_total_members = 0;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];
                        for (item of results[1]) {
                            summary_counter++;
                            entry = {
                                snum: summary_counter,
                                scode: item.account_id,
                                sname: item.account_name,
                                tm: item.total_members
                            }
                            final_total_members += parseInt(entry.tm);
                            summary.summary_data.push(entry);
                        }
                        summary.summary_total = `
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td style="text-align: center;" colspan="2"><strong>Total</strong></td>
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
                                </tr>
                            `;
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;${results[1].length}</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;${final_total_members}</strong></td>
                                </tr>
                            `;
                    }
                    var username = req.user.user_name;

                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/districtdetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 2, 5],
        header_text_align_right: [1, 2, 5],
        text_align_center: [4],
        header_text_align_center: [4],
        summary_text_align_right: [1, 2, 4],
        summary_header_text_align_right: [1, 2, 4],
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Join Date", "Resource Person"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total Members"];
    var report_title = "District Wise Society Detail Report";
    var district_list;
    if (data.select_all == '1')
        district_list = 'All';
    else {
        if ("district_id_list" in data) {
            if (typeof (data.district_id_list) === 'string')
                district_list = data.district_id_list
            else
                district_list = data.district_id_list.join(', ');
        }
        else
            district_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Join Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Join Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>District</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${district_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.to_date, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                    WHERE Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            else {
                sql_arr = [data.district_id_list, data.from_date, data.to_date, data.district_id_list, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id,
                        Sub_Account.sub_account_name,
                        DATE_FORMAT(Account_Balance.join_date,'%d/%m/%Y') AS join_date,
                        Account_Balance.resource_person_id
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                        INNER JOIN Village
                            ON Account_Head.village_id = Village.village_id
                        INNER JOIN Taluka
                            ON Village.taluka_id = Taluka.taluka_id
                    WHERE Taluka.district_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    ORDER BY Account_Balance.account_id ASC;
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Count(Account_Balance.sub_account_id) AS total_members
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Village
                            ON Account_Head.village_id = Village.village_id
                        INNER JOIN Taluka
                            ON Village.taluka_id = Taluka.taluka_id
                    WHERE Taluka.district_id IN (?) AND Account_Balance.join_date >= ? AND Account_Balance.join_date <= ?
                    GROUP BY Account_Balance.account_id
                    ORDER BY Account_Balance.account_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    if (results[0].length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;0</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;0</strong></td>
                                </tr>
                            `;
                    }
                    else {
                        var curr_id = results[0][0].account_id, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0][0].account_id + " - " + results[0][0].account_name, entry;

                        // DataRows Generation with balance
                        for (item of results[0]) {
                            new_id = item.account_id;
                            if (curr_id != new_id) {
                                data_counter = 1;
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry
                                }
                                datarows.push(entry);
                                sub_title = item.account_id + " - " + item.account_name;
                                curr_id = new_id;
                                data_entry = [];
                            }
                            single_entry = {
                                snum: data_counter,
                                mid: item.sub_account_id,
                                mname: item.sub_account_name,
                                jdate: item.join_date,
                                rp: item.resource_person_id,
                            };
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        entry = {
                            data_title: sub_title,
                            data: data_entry
                        }
                        datarows.push(entry);

                        // Summary Generation with balance
                        var summary_counter = 0, final_total_members = 0;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];
                        for (item of results[1]) {
                            summary_counter++;
                            entry = {
                                snum: summary_counter,
                                scode: item.account_id,
                                sname: item.account_name,
                                tm: item.total_members
                            }
                            final_total_members += parseInt(entry.tm);
                            summary.summary_data.push(entry);
                        }
                        summary.summary_total = `
                                <tr style="background-color: gray;">
                                    <td></td>
                                    <td style="text-align: center;" colspan="2"><strong>Total</strong></td>
                                    <td style="text-align: right;"><strong>${final_total_members}</<strong></td>
                                </tr>
                            `;
                        data_global_total = `
                                <tr style="background-color: gray;text-align: center;width:100%">
                                    <td><strong>Total Societies&nbsp;:&nbsp;&nbsp;${results[1].length}</strong></td>
                                    <td><strong>Total Members&nbsp;:&nbsp;&nbsp;${final_total_members}</strong></td>
                                </tr>
                            `;
                    }
                    var username = req.user.user_name;

                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                        dataobject.data_global_total = data_global_total;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societybalancedetails', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 3, 4, 5, 6],
        header_text_align_right: [1, 3, 4, 5, 6],
        summary_text_align_right: [1, 2, 4, 5, 6, 7],
        summary_header_text_align_right: [1, 2, 4, 5, 6, 7]
    };
    var headers = ["Member ID", "Member Name", "Opening Balance", "Credit", "Debit", "Closing Balance"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Total OP", "Total CR", "Total DR", "Total CL"];
    var report_title = "Society Wise Periodical Balance Report";
    var soc_led_list;
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.from_date, data.to_date, data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        (
                            CASE
                                WHEN Account_Balance.op_crdr = "DR" THEN (-1)*Account_Balance.op_balance
                                ELSE Account_Balance.op_balance
                            END
                        ) AS op1,
                        IFNULL(
                            (
                                SELECT
                                    (SUM(Ledger.cr_amount) - SUM(Ledger.dr_amount))
                                FROM Ledger
                                WHERE Ledger.sub_account_id = sid AND Ledger.transaction_date < ?
                            )
                        ,0) AS op2,
                        IFNULL(
                            (
                                SELECT
                                    SUM(Ledger.cr_amount)
                                FROM Ledger
                                WHERE Ledger.sub_account_id = sid AND Ledger.transaction_date >= ? AND Ledger.transaction_date <= ?
                            )
                        ,0) AS cr,
                        IFNULL(
                            (
                                SELECT
                                    SUM(Ledger.dr_amount)
                                FROM Ledger
                                WHERE Ledger.sub_account_id = sid AND Ledger.transaction_date >= ? AND Ledger.transaction_date <= ?
                            )
                        ,0) AS dr
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Head.is_society = 1
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                `;
            }
            else {
                sql_arr = [data.from_date, data.from_date, data.to_date, data.from_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        (
                            CASE
                                WHEN Account_Balance.op_crdr = "DR" THEN (-1)*Account_Balance.op_balance
                                ELSE Account_Balance.op_balance
                            END
                        ) AS op1,
                        IFNULL(
                            (
                                SELECT
                                    (SUM(Ledger.cr_amount) - SUM(Ledger.dr_amount))
                                FROM Ledger
                                WHERE Ledger.sub_account_id = sid AND Ledger.transaction_date < ?
                            )
                        ,0) AS op2,
                        IFNULL(
                            (
                                SELECT
                                    SUM(Ledger.cr_amount)
                                FROM Ledger
                                WHERE Ledger.sub_account_id = sid AND Ledger.transaction_date >= ? AND Ledger.transaction_date <= ?
                            )
                        ,0) AS cr,
                        IFNULL(
                            (
                                SELECT
                                    SUM(Ledger.dr_amount)
                                FROM Ledger
                                WHERE Ledger.sub_account_id = sid AND Ledger.transaction_date >= ? AND Ledger.transaction_date <= ?
                            )
                        ,0) AS dr
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.account_id IN (?) AND Account_Head.is_society = 1
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="2"></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                            </tr>
                        `;
                    }
                    else {
                        var curr_id = results[0].aid, new_id, data_entry = [], single_entry, sub_title = results[0].aid + " - " + results[0].aname, entry, s_op = 0.00, s_cr = 0.00, s_dr = 0.00, s_cl = 0.00, op = 0.00, cr = 0.00, dr = 0.00, cl = 0.00, data_total, s_op_global = 0.00, s_cr_global = 0.00, s_dr_global = 0.00, s_cl_global = 0.00, op_string, cl_string, last_aid, last_aname;

                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        last_aid = curr_id;
                        last_aname = results[0].aname;

                        // DataRows Generation
                        for (item of results) {
                            new_id = item.aid;
                            if (curr_id != new_id) {
                                if (s_op >= 0) {
                                    op_string = Math.abs(s_op).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " CR";
                                }
                                else {
                                    op_string = Math.abs(s_op).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " DR";
                                }
                                if (s_cl >= 0) {
                                    cl_string = Math.abs(s_cl).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " CR";
                                }
                                else {
                                    cl_string = Math.abs(s_cl).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " DR";
                                }
                                data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td colspan="2"></td>
                                        <td><strong>${op_string}</strong></td>
                                        <td style="text-align: right;"><strong>${s_cr.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                        <td style="text-align: right;"><strong>${s_dr.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                        <td><strong>${cl_string}</strong></td>
                                    </tr>
                                `;
                                sentry = {
                                    snum: summary_counter,
                                    aid: last_aid,
                                    aname: last_aname,
                                    op: op_string,
                                    cr: s_cr.toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: s_dr.toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    cl: cl_string
                                };
                                if (data.show_zero == '0') {
                                    if (s_op != 0 || s_cr != 0 || s_dr != 0) {
                                        summary_counter++;
                                        summary.summary_data.push(sentry);
                                    }
                                }
                                else {
                                    summary_counter++;
                                    summary.summary_data.push(sentry);
                                }
                                s_op_global += parseFloat(s_op);
                                s_cr_global += parseFloat(s_cr);
                                s_dr_global += parseFloat(s_dr);
                                s_cl_global += parseFloat(s_cl);
                                if (data_entry.length > 0) {
                                    entry = {
                                        data_title: sub_title,
                                        data: data_entry,
                                        data_total
                                    };
                                    datarows.push(entry);
                                }
                                sub_title = item.aid + " - " + item.aname;
                                curr_id = new_id;
                                s_op = 0.00;
                                s_cr = 0.00;
                                s_dr = 0.00;
                                s_cl = 0.00;
                                data_entry = [];
                            }
                            op = (parseFloat(item.op1) + parseFloat(item.op2)) || 0.00;
                            cr = parseFloat(item.cr) || 0.00;
                            dr = parseFloat(item.dr) || 0.00;
                            cl = parseFloat(op) + parseFloat(cr) - parseFloat(dr);
                            if (op >= 0) {
                                op_string = Math.abs(op).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " CR";
                            }
                            else {
                                op_string = Math.abs(op).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " DR";
                            }
                            if (cl >= 0) {
                                cl_string = Math.abs(cl).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " CR";
                            }
                            else {
                                cl_string = Math.abs(cl).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " DR";
                            }
                            single_entry = {
                                mid: item.sid,
                                mname: item.sname,
                                op: op_string,
                                cr: cr.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                dr: dr.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                cl: cl_string
                            };
                            s_op += parseFloat(op);
                            s_cr += parseFloat(cr);
                            s_dr += parseFloat(dr);
                            s_cl += parseFloat(cl);
                            if (data.show_zero == '0') {
                                if (op != 0 || cr != 0 || dr != 0) {
                                    last_aid = item.aid;
                                    last_aname = item.aname;
                                    data_entry.push(single_entry);
                                }
                            }
                            else {
                                last_aid = item.aid;
                                last_aname = item.aname;
                                data_entry.push(single_entry);
                            }
                        }
                        if (s_op >= 0) {
                            op_string = Math.abs(s_op).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " CR";
                        }
                        else {
                            op_string = Math.abs(s_op).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " DR";
                        }
                        if (s_cl >= 0) {
                            cl_string = Math.abs(s_cl).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " CR";
                        }
                        else {
                            cl_string = Math.abs(s_cl).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " DR";
                        }
                        sentry = {
                            snum: summary_counter,
                            aid: last_aid,
                            aname: last_aname,
                            op: op_string,
                            cr: s_cr,
                            dr: s_dr,
                            cl: cl_string
                        };
                        if (data.show_zero == '0') {
                            if (s_op != 0 || s_cr != 0 || s_dr != 0) {
                                summary.summary_data.push(sentry);
                            }
                        }
                        else {
                            summary.summary_data.push(sentry);
                        }
                        s_op_global += parseFloat(s_op);
                        s_cr_global += parseFloat(s_cr);
                        s_dr_global += parseFloat(s_dr);
                        s_cl_global += parseFloat(s_cl);
                        var s_op_string, s_cl_string;
                        if (s_op_global >= 0) {
                            s_op_string = Math.abs(s_op_global).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " CR";
                        }
                        else {
                            s_op_string = Math.abs(s_op_global).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " DR";
                        }
                        if (s_cl_global >= 0) {
                            s_cl_string = Math.abs(s_cl_global).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " CR";
                        }
                        else {
                            s_cl_string = Math.abs(s_cl_global).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " DR";
                        }
                        data_total = `
                            <tr style="background-color: silver;">
                                <td colspan="2"></td>
                                <td style="text-align: right;"><strong>${op_string}</strong></td>
                                <td style="text-align: right;"><strong>${s_cr.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${s_dr.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${cl_string}</strong></td>
                            </tr>
                            <tr style="height: 20px !important;background-color: #FFFFFF;">
                                <td colspan="7"></td>
                            </tr>
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="2" style="text-align: center;"><strong>Grand Total</strong></td>
                                <td style="text-align: right;"><strong>${s_op_string}</strong></td>
                                <td style="text-align: right;"><strong>${s_cr_global.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${s_dr_global.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${s_cl_string}</strong></td>
                            </tr>
                        `;
                        if (data_entry.length > 0) {
                            entry = {
                                data_title: sub_title,
                                data: data_entry,
                                data_total
                            }
                            datarows.push(entry);
                        }

                        // Summary Generation
                        summary.summary_total = `
                            <tr style="background-color: gray;">
                                <td colspan="3" style="text-align: center;"><strong>Grand Total</strong></td>
                                <td style="text-align: right;"><strong>${s_op_string}</strong></td>
                                <td style="text-align: right;"><strong>${s_cr_global.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${s_dr_global.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${s_cl_string}</strong></td>
                            </tr>
                        `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        settings,
                        username
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societybalancedetailsondate', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 3, 4],
        header_text_align_right: [1, 3, 4],
        summary_text_align_right: [1, 2, 4, 5],
        summary_header_text_align_right: [1, 2, 4, 5]
    };
    var headers = ["Member ID", "Member Name", "Credit", "Debit"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Credit", "Debit"];
    var report_title = "Society Wise Periodical Balance Detail Report";
    var soc_led_list;
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>As on Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.to_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        Account_Balance.op_balance AS op,
                        (
                            SELECT
                                SUM(Ledger.cr_amount)
                            FROM Ledger
                            WHERE Ledger.sub_account_id = sid AND Ledger.transaction_date <= ?
                        ) AS cr,
                        (
                            SELECT
                                SUM(Ledger.dr_amount)
                            FROM Ledger
                            WHERE Ledger.sub_account_id = sid AND Ledger.transaction_date <= ?
                        ) AS dr
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Head.is_society = 1
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                `;
            }
            else {
                sql_arr = [data.to_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        Account_Balance.op_balance AS op,
                        (
                            SELECT
                                SUM(Ledger.cr_amount)
                            FROM Ledger
                            WHERE Ledger.sub_account_id = sid AND Ledger.transaction_date <= ?
                        ) AS cr,
                        (
                            SELECT
                                SUM(Ledger.dr_amount)
                            FROM Ledger
                            WHERE Ledger.sub_account_id = sid AND Ledger.transaction_date <= ?
                        ) AS dr
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Account_Balance.sub_account_id = Sub_Account.sub_account_id
                    WHERE Account_Balance.account_id IN (?) AND Account_Head.is_society = 1
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="2"><strong>Grand Total</strong></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                            </tr>
                        `;
                    }
                    else {
                        var curr_id = results[0].aid, new_id, data_entry = [], single_entry, sub_title = results[0].aid + " - " + results[0].aname, entry, s_cr = 0.00, s_dr = 0.00, op = 0.00, cr = 0.00, dr = 0.00, cl = 0.00, data_total, s_cr_global = 0.00, s_dr_global = 0.00, last_aid, last_aname;

                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        last_aid = curr_id;
                        last_aname = results[0].aname;

                        // DataRows Generation
                        for (item of results) {
                            new_id = item.aid;
                            if (curr_id != new_id) {
                                data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td colspan="2"></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                    </tr>
                                `;
                                sentry = {
                                    snum: summary_counter,
                                    aid: last_aid,
                                    aname: last_aname,
                                    cr: Math.abs(s_cr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: Math.abs(s_dr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                if (data.show_zero == '0') {
                                    if (s_cr != 0 || s_dr != 0) {
                                        summary_counter++;
                                        summary.summary_data.push(sentry);
                                    }
                                }
                                else {
                                    summary_counter++;
                                    summary.summary_data.push(sentry);
                                }
                                s_cr_global += parseFloat(s_cr);
                                s_dr_global += parseFloat(s_dr);
                                if (data_entry.length > 0) {
                                    entry = {
                                        data_title: sub_title,
                                        data: data_entry,
                                        data_total
                                    };
                                    datarows.push(entry);
                                }
                                sub_title = item.aid + " - " + item.aname;
                                curr_id = new_id;
                                s_cr = 0.00;
                                s_dr = 0.00;
                                data_entry = [];
                            }
                            op = parseFloat(item.op) || 0.00;
                            cr = parseFloat(item.cr) || 0.00;
                            dr = parseFloat(item.dr) || 0.00;
                            cl = parseFloat(op) + parseFloat(cr) - parseFloat(dr);
                            if (cl > 0) {
                                single_entry = {
                                    mid: item.sid,
                                    mname: item.sname,
                                    cr: Math.abs(cl).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: ' '
                                };
                                s_cr += parseFloat(cl);
                                last_aid = item.aid;
                                last_aname = item.aname;
                                data_entry.push(single_entry);
                            }
                            else if (cl < 0) {
                                single_entry = {
                                    mid: item.sid,
                                    mname: item.sname,
                                    cr: ' ',
                                    dr: Math.abs(cl).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                s_dr += parseFloat(cl);
                                last_aid = item.aid;
                                last_aname = item.aname;
                                data_entry.push(single_entry);
                            }
                            else {
                                if (data.show_zero == '1') {
                                    single_entry = {
                                        mid: item.sid,
                                        mname: item.sname,
                                        cr: '0',
                                        dr: ' '
                                    };
                                    last_aid = item.aid;
                                    last_aname = item.aname;
                                    data_entry.push(single_entry);
                                }
                            }
                        }
                        sentry = {
                            snum: summary_counter,
                            aid: last_aid,
                            aname: last_aname,
                            cr: Math.abs(s_cr).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }),
                            dr: Math.abs(s_dr).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })
                        };
                        if (data.show_zero == '0') {
                            if (s_cr != 0 || s_dr != 0) {
                                summary.summary_data.push(sentry);
                            }
                        }
                        else {
                            summary.summary_data.push(sentry);
                        }
                        s_cr_global += parseFloat(s_cr);
                        s_dr_global += parseFloat(s_dr);
                        data_total = `
                            <tr style="background-color: silver;">
                                <td colspan="2"></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                            <tr style="height: 20px !important;background-color: #FFFFFF;">
                                <td colspan="7"></td>
                            </tr>
                            <tr style="background-color: gray;">
                                <td colspan="2" style="text-align: center;"><strong>Grand Total</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                        if (data_entry.length > 0) {
                            entry = {
                                data_title: sub_title,
                                data: data_entry,
                                data_total
                            }
                            datarows.push(entry);
                        }
                        else {
                            data_total = `
                                <tr style="height: 20px !important;background-color: #FFFFFF;">
                                    <td colspan="7"></td>
                                </tr>
                                <tr style="background-color: gray;">
                                    <td colspan="2" style="text-align: center;"><strong>Grand Total</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                    <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                </tr>
                            `;
                            entry = {
                                data_total
                            }
                            datarows.push(entry);
                        }
                        // Summary Generation
                        summary.summary_total = `
                            <tr style="background-color: gray;">
                                <td colspan="3" style="text-align: center;"><strong>Grand Total</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societyledger', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    if (!("select_all" in data))
        data.select_all = '0';
    var settings = {
        text_align_right: [3, 4],
        text_align_center: [1],
        header_text_align_right: [3, 4],
        header_text_align_center: [1],
        summary_text_align_right: [1, 2, 4, 5],
        summary_header_text_align_right: [1, 2, 4, 5]
    };
    var headers = ["Date", "Narration", "Credit", "Debit"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "CR", "DR"];
    var report_title = "Society Account Ledger Report";
    var soc_led_list;
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.from_date, data.to_date];
                sql = `
                    SELECT
                        DISTINCT Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        (
                            SELECT
                                SUM(IF(Account_Balance.op_crdr = "DR",-1*Account_Balance.op_balance,Account_Balance.op_balance))
                            FROM Account_Balance
                            WHERE Account_Balance.account_id = aid
                        ) AS op1,
                        IFNULL(
                            (
                                SELECT
                                    (SUM(Ledger.cr_amount) - SUM(Ledger.dr_amount))
                                FROM Ledger
                                WHERE Ledger.account_id = aid AND Ledger.transaction_date <= ?
                            )
                        ,0) AS op2,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration,
                        IFNULL(Ledger.cr_amount,0) AS cr,
                        IFNULL(Ledger.dr_amount,0) AS dr
                        FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Ledger
                            ON Ledger.account_id = Account_Balance.account_id
                    WHERE Account_Head.is_society = 1 AND Ledger.transaction_date >= ? AND Ledger.transaction_date <= ?
                    ORDER BY Account_Balance.account_id ASC, Ledger.transaction_date ASC;
                `;
            }
            else {
                sql_arr = [data.from_date, data.from_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        DISTINCT Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        (
                            SELECT
                                SUM(IF(Account_Balance.op_crdr = "DR",-1*Account_Balance.op_balance,Account_Balance.op_balance))
                            FROM Account_Balance
                            WHERE Account_Balance.account_id = aid
                        ) AS op1,
                        IFNULL(
                            (
                                SELECT
                                    (SUM(Ledger.cr_amount) - SUM(Ledger.dr_amount))
                                FROM Ledger
                                WHERE Ledger.account_id = aid AND Ledger.transaction_date <= ?
                            )
                        ,0) AS op2,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration,
                        IFNULL(Ledger.cr_amount,0) AS cr,
                        IFNULL(Ledger.dr_amount,0) AS dr
                        FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Ledger
                            ON Ledger.account_id = Account_Balance.account_id
                    WHERE Account_Head.is_society = 1 AND Ledger.transaction_date >= ? AND Ledger.transaction_date <= ? AND Account_Head.account_id IN (?)
                    ORDER BY Account_Balance.account_id ASC, Ledger.transaction_date ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    // console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="2"></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                            </tr>
                        `;
                    }
                    else {
                        var curr_id = results[0].aid, new_id, data_entry = [], single_entry, sub_title = results[0].aid + " - " + results[0].aname, entry, s_cr = 0.00, s_dr = 0.00, op = 0.00, cr = 0.00, dr = 0.00, data_total, s_cr_global = 0.00, s_dr_global = 0.00, cl_balance = 0.00, last_aname;

                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        // Opening Entry
                        var fr_date_arr = data.from_date.split('-');
                        var fr_date = fr_date_arr[2] + "/" + fr_date_arr[1] + "/" + fr_date_arr[0];
                        var to_date_arr = data.to_date.split('-');
                        var to_date = to_date_arr[2] + "/" + to_date_arr[1] + "/" + to_date_arr[0];
                        op = (parseFloat(results[0].op1) + parseFloat(results[0].op2)) || 0.00;
                        last_aname = results[0].aname;
                        if (op >= 0) {
                            single_entry = {
                                date: fr_date,
                                narration: "Opening Balance",
                                cr: Math.abs(op).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                dr: ' '
                            };
                            s_cr += Math.abs(parseFloat(op));
                        }
                        else {
                            single_entry = {
                                date: fr_date,
                                narration: "Opening Balance",
                                cr: ' ',
                                dr: Math.abs(op).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                            };
                            s_dr += Math.abs(parseFloat(op));
                        }
                        data_entry.push(single_entry);

                        // DataRows Generation
                        for (item of results) {
                            new_id = item.aid;
                            if (curr_id != new_id) {
                                cl_balance = parseFloat(s_cr) - parseFloat(s_dr);
                                if (cl_balance >= 0) {
                                    single_entry = {
                                        date: to_date,
                                        narration: "Closing Balance",
                                        cr: ' ',
                                        dr: Math.abs(cl_balance).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) + ' CR'
                                    }
                                    s_dr += Math.abs(parseFloat(cl_balance));
                                }
                                else {
                                    single_entry = {
                                        date: to_date,
                                        narration: "Closing Balance",
                                        cr: Math.abs(cl_balance).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) + ' DR',
                                        dr: ' '
                                    }
                                    s_cr += Math.abs(parseFloat(cl_balance));
                                }
                                data_entry.push(single_entry);
                                data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td colspan="2"></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                    </tr>
                                `;
                                sentry = {
                                    snum: summary_counter,
                                    aid: curr_id,
                                    aname: last_aname,
                                    cr: Math.abs(s_cr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: Math.abs(s_dr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                summary_counter++;
                                summary.summary_data.push(sentry);
                                s_cr_global += parseFloat(s_cr);
                                s_dr_global += parseFloat(s_dr);
                                if (data_entry.length > 0) {
                                    entry = {
                                        data_title: sub_title,
                                        data: data_entry,
                                        data_total
                                    };
                                    datarows.push(entry);
                                }
                                sub_title = item.aid + " - " + item.aname;
                                curr_id = new_id;
                                s_cr = 0.00;
                                s_dr = 0.00;
                                data_entry = [];
                                op = parseFloat(item.op1) + parseFloat(item.op2);
                                if (op >= 0) {
                                    single_entry = {
                                        date: fr_date,
                                        narration: "Opening Balance",
                                        cr: Math.abs(op).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        dr: ' '
                                    };
                                    s_cr += Math.abs(parseFloat(op));
                                }
                                else {
                                    single_entry = {
                                        date: fr_date,
                                        narration: "Opening Balance",
                                        cr: ' ',
                                        dr: Math.abs(op).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })
                                    };
                                    s_dr += Math.abs(parseFloat(op));
                                }
                                data_entry.push(single_entry);
                            }
                            cr = Math.abs(parseFloat(item.cr)) || 0.00;
                            dr = Math.abs(parseFloat(item.dr)) || 0.00;
                            if (dr > 0) {
                                single_entry = {
                                    date: item.tc_date,
                                    narration: item.narration,
                                    cr: ' ',
                                    dr: Math.abs(dr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                s_dr += dr;
                            }
                            else {
                                single_entry = {
                                    date: item.tc_date,
                                    narration: item.narration,
                                    cr: Math.abs(cr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: ' '
                                };
                                s_cr += cr;
                            }
                            data_entry.push(single_entry);
                            last_aname = item.aname;
                        }
                        cl_balance = parseFloat(s_cr) - parseFloat(s_dr);
                        if (cl_balance >= 0) {
                            single_entry = {
                                date: to_date,
                                narration: "Closing Balance",
                                cr: ' ',
                                dr: Math.abs(cl_balance).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + ' CR'
                            }
                            s_dr += Math.abs(parseFloat(cl_balance));
                        }
                        else {
                            single_entry = {
                                date: to_date,
                                narration: "Closing Balance",
                                cr: Math.abs(cl_balance).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + ' DR',
                                dr: ' '
                            }
                            s_cr += Math.abs(parseFloat(cl_balance));
                        }
                        data_entry.push(single_entry);
                        data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td colspan="2"></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                    </tr>
                                `;
                        sentry = {
                            snum: summary_counter,
                            aid: curr_id,
                            aname: last_aname,
                            cr: Math.abs(s_cr).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }),
                            dr: Math.abs(s_dr).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })
                        };
                        summary_counter++;
                        summary.summary_data.push(sentry);
                        s_cr_global += parseFloat(s_cr);
                        s_dr_global += parseFloat(s_dr);
                        if (data_entry.length > 0) {
                            entry = {
                                data_title: sub_title,
                                data: data_entry,
                                data_total
                            };
                            datarows.push(entry);
                        }
                        // Summary Generation
                        summary.summary_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="3"></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/memberledger', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [3, 4],
        text_align_center: [1],
        header_text_align_right: [3, 4],
        header_text_align_center: [1],
        summary_text_align_right: [1, 2, 4, 5],
        summary_header_text_align_right: [1, 2, 4, 5]
    };
    var headers = ["Date", "Narration", "Credit", "Debit"];
    var summary_headers = ["Sr.No.", "Member ID", "Member Name", "CR", "DR"];
    var report_title = "Member Account Ledger Report";
    var mem_led_list;
    if (data.select_all == '1')
        mem_led_list = 'All';
    else {
        if ("sub_account_id_list" in data) {
            if (typeof (data.sub_account_id_list) === 'string')
                mem_led_list = data.sub_account_id_list
            else
                mem_led_list = data.sub_account_id_list.join(', ');
        }
        else
            mem_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Member</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${mem_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.from_date, data.to_date];
                sql = `
                    SELECT
                        DISTINCT Account_Balance.sub_account_id AS aid,
                        Sub_Account.sub_account_name AS aname,
                        (
                            SELECT
                                SUM(IF(Account_Balance.op_crdr = "DR",-1*Account_Balance.op_balance,Account_Balance.op_balance))
                            FROM Account_Balance
                            WHERE Account_Balance.sub_account_id = aid
                        ) AS op1,
                        IFNULL(
                            (
                                SELECT
                                    (SUM(Ledger.cr_amount) - SUM(Ledger.dr_amount))
                                FROM Ledger
                                WHERE Ledger.sub_account_id = aid AND Ledger.transaction_date <= ?
                            )
                        ,0) AS op2,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration,
                        IFNULL(Ledger.cr_amount,0) AS cr,
                        IFNULL(Ledger.dr_amount,0) AS dr
                        FROM Account_Balance
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                        INNER JOIN Ledger
                            ON Ledger.sub_account_id = Account_Balance.sub_account_id
                    WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date <= ?
                    ORDER BY Account_Balance.sub_account_id ASC, Ledger.transaction_date ASC;
                `;
            }
            else {
                sql_arr = [data.from_date, data.from_date, data.to_date, data.sub_account_id_list];
                sql = `
                    SELECT
                        DISTINCT Account_Balance.sub_account_id AS aid,
                        Sub_Account.sub_account_name AS aname,
                        (
                            SELECT
                                SUM(IF(Account_Balance.op_crdr = "DR",-1*Account_Balance.op_balance,Account_Balance.op_balance))
                            FROM Account_Balance
                            WHERE Account_Balance.sub_account_id = aid
                        ) AS op1,
                        IFNULL(
                            (
                                SELECT
                                    (SUM(Ledger.cr_amount) - SUM(Ledger.dr_amount))
                                FROM Ledger
                                WHERE Ledger.sub_account_id = aid AND Ledger.transaction_date <= ?
                            )
                        ,0) AS op2,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration,
                        IFNULL(Ledger.cr_amount,0) AS cr,
                        IFNULL(Ledger.dr_amount,0) AS dr
                        FROM Account_Balance
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                        INNER JOIN Ledger
                            ON Ledger.sub_account_id = Account_Balance.sub_account_id
                    WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date <= ? AND Sub_Account.sub_account_id IN (?)
                    ORDER BY Account_Balance.sub_account_id ASC, Ledger.transaction_date ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="2"></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                            </tr>
                        `;
                    }
                    else {
                        var curr_id = results[0].aid, new_id, data_entry = [], single_entry, sub_title = results[0].aid + " - " + results[0].aname, entry, s_cr = 0.00, s_dr = 0.00, op = 0.00, cr = 0.00, dr = 0.00, data_total, s_cr_global = 0.00, s_dr_global = 0.00, cl_balance = 0.00, last_aname;

                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        // Opening Entry
                        var fr_date_arr = data.from_date.split('-');
                        var fr_date = fr_date_arr[2] + "/" + fr_date_arr[1] + "/" + fr_date_arr[0];
                        var to_date_arr = data.to_date.split('-');
                        var to_date = to_date_arr[2] + "/" + to_date_arr[1] + "/" + to_date_arr[0];
                        op = (parseFloat(results[0].op1) + parseFloat(results[0].op2)) || 0.00;
                        last_aname = results[0].aname;
                        if (op >= 0) {
                            single_entry = {
                                date: fr_date,
                                narration: "Opening Balance",
                                cr: Math.abs(op).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                dr: ' '
                            };
                            s_cr += Math.abs(parseFloat(op));
                        }
                        else {
                            single_entry = {
                                date: fr_date,
                                narration: "Opening Balance",
                                cr: ' ',
                                dr: Math.abs(op).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                            };
                            s_dr += Math.abs(parseFloat(op));
                        }
                        data_entry.push(single_entry);

                        // DataRows Generation
                        for (item of results) {
                            new_id = item.aid;
                            if (curr_id != new_id) {
                                cl_balance = parseFloat(s_cr) - parseFloat(s_dr);
                                if (cl_balance >= 0) {
                                    single_entry = {
                                        date: to_date,
                                        narration: "Closing Balance",
                                        cr: ' ',
                                        dr: Math.abs(cl_balance).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) + " CR"
                                    }
                                    s_dr += Math.abs(parseFloat(cl_balance));
                                }
                                else {
                                    single_entry = {
                                        date: to_date,
                                        narration: "Closing Balance",
                                        cr: Math.abs(cl_balance).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) + " DR",
                                        dr: ' '
                                    }
                                    s_cr += Math.abs(parseFloat(cl_balance));
                                }
                                data_entry.push(single_entry);
                                data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td colspan="2"></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                    </tr>
                                `;
                                sentry = {
                                    snum: summary_counter,
                                    aid: curr_id,
                                    aname: last_aname,
                                    cr: Math.abs(s_cr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: Math.abs(s_dr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                summary_counter++;
                                summary.summary_data.push(sentry);
                                s_cr_global += parseFloat(s_cr);
                                s_dr_global += parseFloat(s_dr);
                                if (data_entry.length > 0) {
                                    entry = {
                                        data_title: sub_title,
                                        data: data_entry,
                                        data_total
                                    };
                                    datarows.push(entry);
                                }
                                sub_title = item.aid + " - " + item.aname;
                                curr_id = new_id;
                                s_cr = 0.00;
                                s_dr = 0.00;
                                data_entry = [];
                                op = parseFloat(item.op1) + parseFloat(item.op2);
                                if (op >= 0) {
                                    single_entry = {
                                        date: fr_date,
                                        narration: "Opening Balance",
                                        cr: Math.abs(op).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        dr: ' '
                                    };
                                    s_cr += Math.abs(parseFloat(op));
                                }
                                else {
                                    single_entry = {
                                        date: fr_date,
                                        narration: "Opening Balance",
                                        cr: ' ',
                                        dr: Math.abs(op).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })
                                    };
                                    s_dr += Math.abs(parseFloat(op));
                                }
                                data_entry.push(single_entry);
                            }
                            cr = Math.abs(parseFloat(item.cr)) || 0.00;
                            dr = Math.abs(parseFloat(item.dr)) || 0.00;
                            if (dr > 0) {
                                single_entry = {
                                    date: item.tc_date,
                                    narration: item.narration,
                                    cr: ' ',
                                    dr: Math.abs(dr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                s_dr += dr;
                            }
                            else {
                                single_entry = {
                                    date: item.tc_date,
                                    narration: item.narration,
                                    cr: Math.abs(cr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: ' '
                                };
                                s_cr += cr;
                            }
                            data_entry.push(single_entry);
                            last_aname = item.aname;
                        }
                        cl_balance = parseFloat(s_cr) - parseFloat(s_dr);
                        if (cl_balance >= 0) {
                            single_entry = {
                                date: to_date,
                                narration: "Closing Balance",
                                cr: ' ',
                                dr: Math.abs(cl_balance).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " CR"
                            }
                            s_dr += Math.abs(parseFloat(cl_balance));
                        }
                        else {
                            single_entry = {
                                date: to_date,
                                narration: "Closing Balance",
                                cr: Math.abs(cl_balance).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " DR",
                                dr: ' '
                            }
                            s_cr += Math.abs(parseFloat(cl_balance));
                        }
                        data_entry.push(single_entry);
                        data_total = `
                            <tr style="text-align: center;background-color: silver;">
                                <td colspan="2"></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                        sentry = {
                            snum: summary_counter,
                            aid: curr_id,
                            aname: last_aname,
                            cr: Math.abs(s_cr).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }),
                            dr: Math.abs(s_dr).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })
                        };
                        summary_counter++;
                        summary.summary_data.push(sentry);
                        s_cr_global += parseFloat(s_cr);
                        s_dr_global += parseFloat(s_dr);
                        if (data_entry.length > 0) {
                            entry = {
                                data_title: sub_title,
                                data: data_entry,
                                data_total
                            };
                            datarows.push(entry);
                        }
                        // Summary Generation
                        summary.summary_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="3"></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societywisememberledger', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [3, 4],
        text_align_center: [1],
        header_text_align_right: [3, 4],
        header_text_align_center: [1],
        summary_text_align_right: [1, 2, 4, 5],
        summary_header_text_align_right: [1, 2, 4, 5]
    };
    var headers = ["Date", "Narration", "Credit", "Debit"];
    var summary_headers = ["Sr.No.", "Member ID", "Member Name", "CR", "DR"];
    var report_title = "Society Wise Member Account Ledger Report";
    var mem_led_list, soc_led_list;
    if (data.select_all == '1')
        mem_led_list = 'All';
    else {
        if ("sub_account_id_list" in data) {
            if (typeof (data.sub_account_id_list) === 'string')
                mem_led_list = data.sub_account_id_list
            else
                mem_led_list = data.sub_account_id_list.join(', ');
        }
        else
            mem_led_list = 'None';
    }
    if ("account_id_list" in data) {
        if (typeof (data.account_id_list) === 'string')
            soc_led_list = data.account_id_list
        else
            soc_led_list = data.account_id_list.join(', ');
    }
    else
        soc_led_list = 'None';
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Member</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${mem_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.from_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id AS aid,
                        Sub_Account.sub_account_name AS aname,
                        (
                            SELECT
                                SUM(IF(Account_Balance.op_crdr = "DR",-1*Account_Balance.op_balance,Account_Balance.op_balance))
                            FROM Account_Balance
                            WHERE Account_Balance.sub_account_id = aid
                        ) AS op1,
                        IFNULL(
                            (
                                SELECT
                                    (SUM(Ledger.cr_amount) - SUM(Ledger.dr_amount))
                                FROM Ledger
                                WHERE Ledger.sub_account_id = aid AND Ledger.transaction_date <= ?
                            )
                        ,0) AS op2,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration,
                        IFNULL(Ledger.cr_amount,0) AS cr,
                        IFNULL(Ledger.dr_amount,0) AS dr
                        FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                        INNER JOIN Ledger
                            ON Ledger.sub_account_id = Account_Balance.sub_account_id
                    WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date <= ? AND Ledger.account_id = ?
                    ORDER BY Account_Balance.sub_account_id ASC, Ledger.transaction_date ASC;
                `;
            }
            else {
                sql_arr = [data.from_date, data.from_date, data.to_date, data.account_id_list, data.sub_account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id,
                        Account_Head.account_name,
                        Account_Balance.sub_account_id AS aid,
                        Sub_Account.sub_account_name AS aname,
                        (
                            SELECT
                                SUM(IF(Account_Balance.op_crdr = "DR",-1*Account_Balance.op_balance,Account_Balance.op_balance))
                            FROM Account_Balance
                            WHERE Account_Balance.sub_account_id = aid
                        ) AS op1,
                        IFNULL(
                            (
                                SELECT
                                    (SUM(Ledger.cr_amount) - SUM(Ledger.dr_amount))
                                FROM Ledger
                                WHERE Ledger.sub_account_id = aid AND Ledger.transaction_date <= ?
                            )
                        ,0) AS op2,
                        DATE_FORMAT(Ledger.transaction_date,'%d/%m/%Y') AS tc_date,
                        Ledger.narration AS narration,
                        IFNULL(Ledger.cr_amount,0) AS cr,
                        IFNULL(Ledger.dr_amount,0) AS dr
                        FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                        INNER JOIN Ledger
                            ON Ledger.sub_account_id = Account_Balance.sub_account_id
                    WHERE Ledger.transaction_date >= ? AND Ledger.transaction_date <= ? AND Ledger.account_id = ? AND Ledger.sub_account_id IN (?)
                    ORDER BY Account_Balance.sub_account_id ASC, Ledger.transaction_date ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                        data_global_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="2"></td>
                                <td><strong>0</strong></td>
                                <td><strong>0</strong></td>
                            </tr>
                        `;
                    }
                    else {
                        var curr_id = results[0].aid, new_id, data_entry = [], single_entry, sub_title = results[0].aid + " - " + results[0].aname, entry, s_cr = 0.00, s_dr = 0.00, op = 0.00, cr = 0.00, dr = 0.00, data_total, s_cr_global = 0.00, s_dr_global = 0.00, cl_balance = 0.00, last_aname;

                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        // Opening Entry
                        var fr_date_arr = data.from_date.split('-');
                        var fr_date = fr_date_arr[2] + "/" + fr_date_arr[1] + "/" + fr_date_arr[0];
                        var to_date_arr = data.to_date.split('-');
                        var to_date = to_date_arr[2] + "/" + to_date_arr[1] + "/" + to_date_arr[0];
                        op = (parseFloat(results[0].op1) + parseFloat(results[0].op2)) || 0.00;
                        last_aname = results[0].aname;
                        if (op >= 0) {
                            single_entry = {
                                date: fr_date,
                                narration: "Opening Balance",
                                cr: Math.abs(op).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                                dr: ' '
                            };
                            s_cr += Math.abs(parseFloat(op));
                        }
                        else {
                            single_entry = {
                                date: fr_date,
                                narration: "Opening Balance",
                                cr: ' ',
                                dr: Math.abs(op).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }),
                            };
                            s_dr += Math.abs(parseFloat(op));
                        }
                        data_entry.push(single_entry);

                        // DataRows Generation
                        for (item of results) {
                            new_id = item.aid;
                            if (curr_id != new_id) {
                                cl_balance = parseFloat(s_cr) - parseFloat(s_dr);
                                if (cl_balance >= 0) {
                                    single_entry = {
                                        date: to_date,
                                        narration: "Closing Balance",
                                        cr: ' ',
                                        dr: Math.abs(cl_balance).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) + " CR"
                                    }
                                    s_dr += Math.abs(parseFloat(cl_balance));
                                }
                                else {
                                    single_entry = {
                                        date: to_date,
                                        narration: "Closing Balance",
                                        cr: Math.abs(cl_balance).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) + " DR",
                                        dr: ' '
                                    }
                                    s_cr += Math.abs(parseFloat(cl_balance));
                                }
                                data_entry.push(single_entry);
                                data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td colspan="2"></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                        <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                    </tr>
                                `;
                                sentry = {
                                    snum: summary_counter,
                                    aid: curr_id,
                                    aname: last_aname,
                                    cr: Math.abs(s_cr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: Math.abs(s_dr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                summary_counter++;
                                summary.summary_data.push(sentry);
                                s_cr_global += parseFloat(s_cr);
                                s_dr_global += parseFloat(s_dr);
                                if (data_entry.length > 0) {
                                    entry = {
                                        data_title: sub_title,
                                        data: data_entry,
                                        data_total
                                    };
                                    datarows.push(entry);
                                }
                                sub_title = item.aid + " - " + item.aname;
                                curr_id = new_id;
                                s_cr = 0.00;
                                s_dr = 0.00;
                                data_entry = [];
                                op = parseFloat(item.op1) + parseFloat(item.op2);
                                if (op >= 0) {
                                    single_entry = {
                                        date: fr_date,
                                        narration: "Opening Balance",
                                        cr: Math.abs(op).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }),
                                        dr: ' '
                                    };
                                    s_cr += Math.abs(parseFloat(op));
                                }
                                else {
                                    single_entry = {
                                        date: fr_date,
                                        narration: "Opening Balance",
                                        cr: ' ',
                                        dr: Math.abs(op).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })
                                    };
                                    s_dr += Math.abs(parseFloat(op));
                                }
                                data_entry.push(single_entry);
                            }
                            cr = Math.abs(parseFloat(item.cr)) || 0.00;
                            dr = Math.abs(parseFloat(item.dr)) || 0.00;
                            if (dr > 0) {
                                single_entry = {
                                    date: item.tc_date,
                                    narration: item.narration,
                                    cr: ' ',
                                    dr: Math.abs(dr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                s_dr += dr;
                            }
                            else {
                                single_entry = {
                                    date: item.tc_date,
                                    narration: item.narration,
                                    cr: Math.abs(cr).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }),
                                    dr: ' '
                                };
                                s_cr += cr;
                            }
                            data_entry.push(single_entry);
                            last_aname = item.aname;
                        }
                        cl_balance = parseFloat(s_cr) - parseFloat(s_dr);
                        if (cl_balance >= 0) {
                            single_entry = {
                                date: to_date,
                                narration: "Closing Balance",
                                cr: ' ',
                                dr: Math.abs(cl_balance).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " CR"
                            }
                            s_dr += Math.abs(parseFloat(cl_balance));
                        }
                        else {
                            single_entry = {
                                date: to_date,
                                narration: "Closing Balance",
                                cr: Math.abs(cl_balance).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " DR",
                                dr: ' '
                            }
                            s_cr += Math.abs(parseFloat(cl_balance));
                        }
                        data_entry.push(single_entry);
                        data_total = `
                            <tr style="text-align: center;background-color: silver;">
                                <td colspan="2"></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_cr).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_dr).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                        sentry = {
                            snum: summary_counter,
                            aid: curr_id,
                            aname: last_aname,
                            cr: Math.abs(s_cr).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }),
                            dr: Math.abs(s_dr).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })
                        };
                        summary_counter++;
                        summary.summary_data.push(sentry);
                        s_cr_global += parseFloat(s_cr);
                        s_dr_global += parseFloat(s_dr);
                        if (data_entry.length > 0) {
                            entry = {
                                data_title: sub_title,
                                data: data_entry,
                                data_total
                            };
                            datarows.push(entry);
                        }
                        // Summary Generation
                        summary.summary_total = `
                            <tr style="text-align: center;background-color: gray;">
                                <td colspan="3"></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_cr_global).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                                <td style="text-align: right;"><strong>${Math.abs(s_dr_global).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societywisecalwingage', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 2, 6],
        text_align_center: [4, 5],
        header_text_align_right: [1, 2, 6],
        header_text_align_center: [4, 5],
        summary_text_align_right: [1, 2, 4],
        summary_header_text_align_right: [1, 2, 4]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Birth Date", "Calwing Date", "Age(days)"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Average Age(days)"];
    var report_title = "Society Wise Member Calwing Age Report";
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Calwing Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Calwing Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.birth_date,'%d/%m/%Y') AS bdate,
                        DATE_FORMAT(Account_Balance.calwing_date,'%d/%m/%Y') AS cdate,
                        Account_Balance.birth_date AS bcaldate,
                        Account_Balance.calwing_date AS ccaldate
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.birth_date IS NOT NULL AND Account_Balance.calwing_date IS NOT NULL AND Account_Balance.calwing_date >= ? AND Account_Balance.calwing_date <= ?
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC, Account_Balance.birth_date ASC;
                `;
            }
            else {
                sql_arr = [data.from_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.birth_date,'%d/%m/%Y') AS bdate,
                        DATE_FORMAT(Account_Balance.calwing_date,'%d/%m/%Y') AS cdate,
                        Account_Balance.birth_date AS bcaldate,
                        Account_Balance.calwing_date AS ccaldate
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.birth_date IS NOT NULL AND Account_Balance.calwing_date IS NOT NULL AND Account_Balance.calwing_date >= ? AND Account_Balance.calwing_date <= ? AND Account_Balance.account_id IN (?)
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC, Account_Balance.birth_date ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                    }
                    else {
                        var curr_id = results[0].aid, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0].aid + " - " + results[0].aname, entry, days = 0, diff, total_days = 0, avg, data_total, lname;
                        var summary_counter = 1, sentry, date1, date2;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        for (item of results) {
                            new_id = item.aid;
                            if (new_id != curr_id) {
                                if (data_counter != 0) {
                                    avg = parseFloat(total_days) / parseFloat(data_counter - 1);
                                }
                                else {
                                    avg = 0;
                                }
                                data_total = `
                                    <tr style="text-align: center;background-color: silver;">
                                        <td></td>
                                        <td colspan="3"><strong>Average Calwing Period For Whole Society(in Days)</strong></td>
                                        <td colspan="2" style="text-align: right"><strong>${avg.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong></td>
                                    </tr>
                                `;
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry,
                                    data_total
                                };
                                datarows.push(entry);
                                sentry = {
                                    snum: summary_counter,
                                    sid: curr_id,
                                    sname: lname,
                                    age: avg.toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })
                                };
                                summary_counter++;
                                summary.summary_data.push(sentry);
                                data_entry = [];
                                data_counter = 1;
                                total_days = 0;
                                sub_title = item.aid + " - " + item.aname;
                                curr_id = new_id;
                            }
                            date1 = new Date(item.bcaldate);
                            date2 = new Date(item.ccaldate);
                            diff = date2.getTime() - date1.getTime();
                            days = diff / (1000 * 3600 * 24) + 1;
                            single_entry = {
                                snum: data_counter,
                                sid: item.sid,
                                sname: item.sname,
                                bdate: item.bdate,
                                cdate: item.cdate,
                                age: days.toLocaleString('en-IN')
                            };
                            lname = item.aname;
                            total_days += days;
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        avg = parseFloat(total_days) / parseFloat(data_counter - 1);
                        data_total = `
                            <tr style="text-align: center;background-color: silver;">
                                <td></td>
                                <td colspan="3"><strong>Average Calwing Period For Whole Society(in Days)</strong></td>
                                <td colspan="2" style="text-align: right"><strong>${avg.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                        entry = {
                            data_title: sub_title,
                            data: data_entry,
                            data_total
                        };
                        datarows.push(entry);
                        sentry = {
                            snum: summary_counter,
                            sid: curr_id,
                            sname: lname,
                            age: avg.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })
                        };
                        summary.summary_data.push(sentry);
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societywisecalwinganalysis', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 2, 7],
        text_align_center: [4, 5, 6],
        header_text_align_right: [1, 2, 7],
        header_text_align_center: [4, 5, 6],
        summary_text_align_right: [1, 2, 4],
        summary_header_text_align_right: [1, 2, 4]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Calwing Date", "Cancel Date", "Death Date", "Closing Balance"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Closing Balance"];
    var report_title = "Society Wise Member Calwing Analysis Report";
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.calwing_date,'%d/%m/%Y') AS caldate,
                        DATE_FORMAT(Account_Balance.cancel_date,'%d/%m/%Y') AS candate,
                        DATE_FORMAT(Account_Balance.death_date,'%d/%m/%Y') AS deathdate,
                        IF(Account_Balance.cl_crdr = "DR", -1*Account_Balance.cl_balance, Account_Balance.cl_balance) AS cl
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Head.is_society = '1'
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                `;
            }
            else {
                sql_arr = [data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.calwing_date,'%d/%m/%Y') AS caldate,
                        DATE_FORMAT(Account_Balance.cancel_date,'%d/%m/%Y') AS candate,
                        DATE_FORMAT(Account_Balance.death_date,'%d/%m/%Y') AS deathdate,
                        IF(Account_Balance.cl_crdr = "DR", -1*Account_Balance.cl_balance, Account_Balance.cl_balance) AS cl
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Head.is_society = '1' AND Account_Balance.account_id IN (?)
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                    }
                    else {
                        var curr_id = results[0].aid, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0].aid + " - " + results[0].aname, entry, data_total, lname, s_cl_balance, cl_total = 0.00, cl_global = 0.00, s_cl_total, s_cl_global;
                        var summary_counter = 1, sentry, date1, date2;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        for (item of results) {
                            new_id = item.aid;
                            if (new_id != curr_id) {
                                if (cl_total >= 0) {
                                    s_cl_total = Math.abs(cl_total).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " CR";
                                    data_total = `
                                        <tr style="text-align: center;background-color: silver;">
                                            <td></td>
                                            <td colspan="2"><strong>Net Balance</strong></td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td style="text-align: right"><strong>${s_cl_total}</strong></td>
                                        </tr>
                                    `;
                                }
                                else {
                                    s_cl_total = Math.abs(cl_total).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) + " DR";
                                    data_total = `
                                        <tr style="text-align: center;background-color: silver;">
                                            <td></td>
                                            <td colspan="2"><strong>Net Balance</strong></td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td style="text-align: right"><strong>${s_cl_total}</strong></td>
                                        </tr>
                                    `;
                                }
                                if (data_entry.length > 0) {
                                    entry = {
                                        data_title: sub_title,
                                        data: data_entry,
                                        data_total
                                    };
                                    datarows.push(entry);
                                    sentry = {
                                        snum: summary_counter,
                                        sid: curr_id,
                                        sname: lname,
                                        cl_total: s_cl_total
                                    };
                                    cl_global = parseFloat(cl_global) + parseFloat(cl_total);
                                    summary_counter++;
                                    summary.summary_data.push(sentry);
                                }
                                data_entry = [];
                                data_counter = 1;
                                cl_total = 0.00;
                                sub_title = item.aid + " - " + item.aname;
                                curr_id = new_id;
                            }
                            if (item.cl >= 0) {
                                s_cl_balance = Math.abs(item.cl).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " CR";
                            }
                            else {
                                s_cl_balance = Math.abs(item.cl).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + " DR";
                            }
                            single_entry = {
                                snum: data_counter,
                                sid: item.sid,
                                sname: item.sname,
                                caldate: item.caldate,
                                candate: item.candate,
                                deathdate: item.deathdate,
                                cl_balance: s_cl_balance
                            };
                            if (data.show_zero == '0') {
                                if (item.cl != 0) {
                                    lname = item.aname;
                                    cl_total = parseFloat(cl_total) + parseFloat(item.cl);
                                    data_entry.push(single_entry);
                                    data_counter++;
                                }
                            }
                            else {
                                lname = item.aname;
                                cl_total = parseFloat(cl_total) + parseFloat(item.cl);
                                data_entry.push(single_entry);
                                data_counter++;
                            }
                        }
                        if (cl_total >= 0) {
                            s_cl_total = Math.abs(cl_total).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " CR";
                            data_total = `
                                <tr style="background-color: silver;">
                                    <td></td>
                                    <td colspan="2" style="text-align: center;"><strong>Net Balance</strong></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td style="text-align: right"><strong>${s_cl_total}</strong></td>
                                </tr>
                            `;
                        }
                        else {
                            s_cl_total = Math.abs(cl_total).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " DR";
                            data_total = `
                                <tr style="text-align: center;background-color: silver;">
                                    <td></td>
                                    <td colspan="2"><strong>Net Balance</strong></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td style="text-align: right"><strong>${s_cl_total}</strong></td>
                                </tr>
                            `;
                        }
                        if (data_entry.length > 0) {
                            entry = {
                                data_title: sub_title,
                                data: data_entry,
                                data_total
                            };
                            datarows.push(entry);
                            sentry = {
                                snum: summary_counter,
                                sid: curr_id,
                                sname: lname,
                                cl_total: s_cl_total
                            };
                            cl_global = parseFloat(cl_global) + parseFloat(cl_total);
                            summary_counter++;
                            summary.summary_data.push(sentry);
                        }
                        if (cl_global >= 0) {
                            s_cl_global = Math.abs(cl_global).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " CR";
                        }
                        else {
                            s_cl_global = Math.abs(cl_global).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + " DR";
                        }
                        summary.summary_total = `
                            <tr style="background-color: silver;">
                                <td></td>
                                <td colspan="2" style="text-align: center;"><strong>Net Balance</strong></td>
                                <td style="text-align: right"><strong>${s_cl_global}</strong></td>
                            </tr>
                        `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societywiseheiferdate', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 2],
        text_align_center: [4],
        header_text_align_right: [1, 2],
        header_text_align_center: [4]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Heifer Date"];
    var report_title = "Society-Member Heifer Datewise Report";
    var soc_led_list;
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Heifer Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Heifer Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.heifer_date,'%d/%m/%Y') AS hdate
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.heifer_date IS NOT NULL AND Account_Balance.heifer_date >= ? AND Account_Balance.heifer_date <= ?
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                `;
            }
            else {
                sql_arr = [data.from_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.heifer_date,'%d/%m/%Y') AS hdate
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.heifer_date IS NOT NULL AND Account_Balance.heifer_date >= ? AND Account_Balance.heifer_date <= ? AND Account_Balance.account_id IN (?)
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [];
                    if (results.length <= 0) {
                        datarows = [];
                    }
                    else {
                        var curr_id = results[0].aid, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0].aid + " - " + results[0].aname, entry, lname;

                        for (item of results) {
                            new_id = item.aid;
                            if (new_id != curr_id) {
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry
                                };
                                datarows.push(entry);
                                data_entry = [];
                                data_counter = 1;
                                sub_title = item.aid + " - " + item.aname;
                                curr_id = new_id;
                            }
                            single_entry = {
                                snum: data_counter,
                                sid: item.sid,
                                sname: item.sname,
                                hdate: item.hdate
                            };
                            lname = item.aname;
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        entry = {
                            data_title: sub_title,
                            data: data_entry
                        };
                        datarows.push(entry);
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        datarows,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/societywisedeathdate', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        text_align_right: [1, 2],
        text_align_center: [4],
        header_text_align_right: [1, 2],
        header_text_align_center: [4]
    };
    var headers = ["Sr.No.", "Member ID", "Member Name", "Death Date"];
    var report_title = "Society-Member Death Datewise Report";
    var soc_led_list;
    if (data.select_all == '1')
        soc_led_list = 'All';
    else {
        if ("account_id_list" in data) {
            if (typeof (data.account_id_list) === 'string')
                soc_led_list = data.account_id_list
            else
                soc_led_list = data.account_id_list.join(', ');
        }
        else
            soc_led_list = 'None';
    }
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Death Date From</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>Death Date To</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>Society</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td colspan="5"><strong>${soc_led_list}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            if (data.select_all == '1') {
                sql_arr = [data.from_date, data.to_date];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.death_date,'%d/%m/%Y') AS hdate
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.death_date IS NOT NULL AND Account_Balance.death_date >= ? AND Account_Balance.death_date <= ?
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                `;
            }
            else {
                sql_arr = [data.from_date, data.to_date, data.account_id_list];
                sql = `
                    SELECT
                        Account_Balance.account_id AS aid,
                        Account_Head.account_name AS aname,
                        Account_Balance.sub_account_id AS sid,
                        Sub_Account.sub_account_name AS sname,
                        DATE_FORMAT(Account_Balance.death_date,'%d/%m/%Y') AS hdate
                    FROM Account_Balance
                        INNER JOIN Account_Head
                            ON Account_Head.account_id = Account_Balance.account_id
                        INNER JOIN Sub_Account
                            ON Sub_Account.sub_account_id = Account_Balance.sub_account_id
                    WHERE Account_Balance.death_date IS NOT NULL AND Account_Balance.death_date >= ? AND Account_Balance.death_date <= ? AND Account_Balance.account_id IN (?)
                    ORDER BY Account_Balance.account_id ASC, Account_Balance.sub_account_id ASC;
                `;
            }
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [];
                    if (results.length <= 0) {
                        datarows = [];
                    }
                    else {
                        var curr_id = results[0].aid, new_id, data_entry = [], single_entry, data_counter = 1, sub_title = results[0].aid + " - " + results[0].aname, entry, lname;

                        for (item of results) {
                            new_id = item.aid;
                            if (new_id != curr_id) {
                                entry = {
                                    data_title: sub_title,
                                    data: data_entry
                                };
                                datarows.push(entry);
                                data_entry = [];
                                data_counter = 1;
                                sub_title = item.aid + " - " + item.aname;
                                curr_id = new_id;
                            }
                            single_entry = {
                                snum: data_counter,
                                sid: item.sid,
                                sname: item.sname,
                                hdate: item.hdate
                            };
                            lname = item.aname;
                            data_entry.push(single_entry);
                            data_counter++;
                        }
                        entry = {
                            data_title: sub_title,
                            data: data_entry
                        };
                        datarows.push(entry);
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        datarows,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/receiptperiodicalregister', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        header_text_align_right: [1, 3, 5],
        header_text_align_center: [2],
        text_align_right: [1, 3, 5],
        text_align_center: [2],
        summary_text_align_right: [1, 2, 4],
        summary_header_text_align_right: [1, 2, 4]
    };
    var headers = ["Sr.No.", "Receipt ID", "Receipt No.", "Society Name", "Receipt Amount"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Receipt Amount"];
    var report_title = "Periodical Receipt Register";
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            sql_arr = [data.from_date, data.to_date];
            sql = `
                SELECT
                    DATE_FORMAT(Receipt.receipt_date,'%d/%m/%Y') AS rdate,
                    Receipt.receipt_number AS rnum,
                    Receipt.cr_account_id AS aid,
                    Account_Head.account_name AS aname,
                    Receipt.total_amount AS tamount
                FROM Receipt
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Receipt.cr_account_id
                WHERE Receipt.receipt_date IS NOT NULL AND Receipt.receipt_date >= ? AND Receipt.receipt_date <= ?
                ORDER BY Receipt.receipt_date ASC;
            `;
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                    }
                    else {
                        var curr_id, data_entry = [], single_entry, data_counter = 1, entry, data_total, gtotal = 0.00;
                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        var sdata = {};

                        for (item of results) {
                            curr_id = item.aid;
                            if (curr_id in sdata) {
                                sdata[curr_id]["total"] += parseFloat(item.tamount);
                            }
                            else {
                                sdata[curr_id] = {};
                                sdata[curr_id]["name"] = item.aname;
                                sdata[curr_id]["total"] = parseFloat(item.tamount);
                            }
                            single_entry = {
                                snum: data_counter,
                                rdate: item.rdate,
                                rnum: item.rnum,
                                aname: item.aname,
                                total: parseFloat(item.tamount).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })
                            };
                            data_counter++;
                            gtotal = parseFloat(gtotal) + parseFloat(item.tamount);
                            data_entry.push(single_entry);
                        }
                        data_total = `
                            <tr style="background-color: silver;">
                                <td colspan="2"></td>
                                <td colspan="2" style="text-align: center;"><strong>Total</strong></td>
                                <td style="text-align: right"><strong>${gtotal.toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                        entry = {
                            data: data_entry,
                            data_total
                        };
                        datarows.push(entry);
                        for (var key in sdata) {
                            sentry = {
                                snum: summary_counter,
                                aid: key,
                                aname: sdata[key]["name"],
                                total: sdata[key]["total"].toLocaleString('en-IN', {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2
                                })
                            };
                            summary_counter++;
                            summary.summary_data.push(sentry);
                        }
                        summary.summary_total = `
                            <tr style="background-color: silver;">
                                <td></td>
                                <td colspan="2" style="text-align: center;"><strong>Grand Total</strong></td>
                                <td style="text-align: right"><strong>${gtotal.toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.get('/paymentperiodicalregister', middleware.loggedin_as_superuser, (req, res) => {
    var data = req.query;
    var settings = {
        header_text_align_right: [1, 3, 5],
        header_text_align_center: [2],
        text_align_right: [1, 3, 5],
        text_align_center: [2],
        summary_text_align_right: [1, 2, 4],
        summary_header_text_align_right: [1, 2, 4]
    };
    var headers = ["Sr.No.", "Voucher ID", "Voucher No.", "Society Name", "Payment Amount"];
    var summary_headers = ["Sr.No.", "Society ID", "Society Name", "Payment Amount"];
    var report_title = "Periodical Payment Register";
    var report_information = `
        <tr style="background-color: white">
            <td></td>
        </tr>
        <tr style="background-color: silver">
            <td style="text-align: center;"><strong>From Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.from_date)}</strong></td>
            <td style="text-align: center;"><strong>-</strong></td>
            <td style="text-align: center;"><strong>To Date</strong></td>
            <td style="text-align: center;"><strong>:</strong></td>
            <td style="text-align: left;"><strong>${beautifyDate(data.to_date)}</strong></td>
        </tr>
        <tr style="background-color: white">
            <td></td>
        </tr>
    `;
    getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.send({
                status: false
            });
        }
        else {
            var sql, sql_arr = [];
            sql_arr = [data.from_date, data.to_date];
            sql = `
                SELECT
                    DATE_FORMAT(Payment.voucher_date,'%d/%m/%Y') AS rdate,
                    Payment.document_number AS rnum,
                    Payment.dr_account_id AS aid,
                    Account_Head.account_name AS aname,
                    Payment.total_amount AS tamount
                FROM Payment
                    INNER JOIN Account_Head
                        ON Account_Head.account_id = Payment.dr_account_id
                WHERE Payment.voucher_date IS NOT NULL AND Payment.voucher_date >= ? AND Payment.voucher_date <= ?
                ORDER BY Payment.voucher_date ASC;
            `;
            connection.query(sql, sql_arr, (err, results) => {
                connection.release();
                if (err) {
                    console.log(err);
                    res.send({
                        status: false
                    });
                }
                else {
                    //console.log(results);

                    var date = new Date();
                    var dd = ('0' + date.getDate()).slice(-2);
                    var mm = ('0' + (date.getMonth() + 1)).slice(-2);
                    var yyyy = date.getFullYear();
                    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                    var sdate = dd + '/' + mm + '/' + yyyy + ' ' + time;

                    var datarows = [], summary = {}, data_global_total;
                    if (results.length <= 0) {
                        datarows = [];
                        summary = [];
                    }
                    else {
                        var curr_id, data_entry = [], single_entry, data_counter = 1, entry, data_total, gtotal = 0.00;
                        var summary_counter = 1, sentry;
                        summary.summary_headers = summary_headers;
                        summary.summary_len = summary_headers.length;
                        summary.summary_data = [];

                        var sdata = {};

                        for (item of results) {
                            curr_id = item.aid;
                            if (curr_id in sdata) {
                                sdata[curr_id]["total"] += parseFloat(item.tamount);
                            }
                            else {
                                sdata[curr_id] = {};
                                sdata[curr_id]["name"] = item.aname;
                                sdata[curr_id]["total"] = parseFloat(item.tamount);
                            }
                            single_entry = {
                                snum: data_counter,
                                rdate: item.rdate,
                                rnum: item.rnum,
                                aname: item.aname,
                                total: parseFloat(item.tamount).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })
                            };
                            data_counter++;
                            gtotal = parseFloat(gtotal) + parseFloat(item.tamount);
                            data_entry.push(single_entry);
                        }
                        data_total = `
                            <tr style="background-color: silver;">
                                <td colspan="2"></td>
                                <td colspan="2" style="text-align: center;"><strong>Total</strong></td>
                                <td style="text-align: right"><strong>${gtotal.toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                        entry = {
                            data: data_entry,
                            data_total
                        };
                        datarows.push(entry);
                        for (var key in sdata) {
                            sentry = {
                                snum: summary_counter,
                                aid: key,
                                aname: sdata[key]["name"],
                                total: sdata[key]["total"].toLocaleString('en-IN', {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2
                                })
                            };
                            summary_counter++;
                            summary.summary_data.push(sentry);
                        }
                        summary.summary_total = `
                            <tr style="background-color: silver;">
                                <td></td>
                                <td colspan="2" style="text-align: center;"><strong>Grand Total</strong></td>
                                <td style="text-align: right"><strong>${gtotal.toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                        })}</strong></td>
                            </tr>
                        `;
                    }
                    var username = req.user.user_name;
                    var dataobject = {
                        headers,
                        len: headers.length,
                        report_title,
                        report_information,
                        date: sdate,
                        username,
                        settings
                    }
                    if (data.show_details == '1') {
                        dataobject.datarows = datarows;
                    }
                    if (data.show_summary == '1') {
                        dataobject.summary = summary;
                    }
                    var template = "detail-report-main";
                    reportGenerator(dataobject, template, (err, resheaders) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                status: false
                            });
                        }
                        else {
                            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                            var client_link = new URL(fullUrl);
                            var link = new URL(String(resheaders.headers['permanent-link']));
                            if (!link) {
                                res.send({
                                    status: false
                                });
                            }
                            else {
                                link.hostname = client_link.hostname;
                                //console.log("FINAL PDF LINK : ",link.href);
                                //var pdf_id = link.split('/').slice(-2)[0];
                                //console.log(pdf_id);
                                res.send({
                                    status: true,
                                    link: link.href
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;