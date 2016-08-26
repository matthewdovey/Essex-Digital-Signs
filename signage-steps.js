//Set some global variables used by the page
var LabData = null;
var LabUpdate = null;
var date = null;
var hours = null;
var minutes = null;


//This runs on page startup
$(document).ready(function () {

    //Retrieve current time every minute
    GetTime();
    window.setInterval(GetTime, 30000);

    //Put the page in an initial loading state
    $(".col-md-5, .col-md-10").find('h4').text("Refreshing...");
    $('.col-md-2').find('i').removeClass("fa fa-times-circle fa-4x").removeClass("fa fa-exclamation-circle fa-4x").removeClass("fa fa-check-circle fa-4x").addClass("fa fa-check-circle fa-4x");
    $('.row.lab').find('.col-md-5').removeClass('available').removeClass('closed').removeClass('booked').addClass('booked');

    //Set initial value of available and total PCs to ?
    $(" h2.text-right").html("?" + "<span class='total'>/" + " ?" + "</span>");

    //initially no bookings
    $(" .col-md-5").find("p").text("No bookings");

    //Set all printers to unknown
    $(" .bad, .good").removeClass("good").removeClass("bad").addClass("unknown");
    $(" .unknown").html("<i class='fa-li fa fa-print'></i> Printer status unknown</li>");

    //Get data from JSON
    GetData(); //Initial refresh
    window.setInterval(GetData, 10000);

    //Refresh the information displayed on the page
    RefreshPage();
    window.setInterval(RefreshPage, 1000);
});

//Returns the current time in an hours and minutes 00:00 format
function GetTime() {
    LabUpdate = new Date();

    hours = LabUpdate.getHours();
    minutes = LabUpdate.getMinutes();

    //If 'hours' is below 10 add a 0 before
    if (hours < 10) {
        hours = "0"+hours;
    }
    //If 'minutes' is below 10 add a 0 before
    if (minutes < 10) {
        minutes = "0"+minutes;
    }

    //Displaying time
    $("h1.text-right").text(hours + ':' + minutes);
}

//Returns today's date
function GetDate() {
    date = new Date();
    var dd = date.getDate();
    var mm = date.getMonth()+1; //January is 0!
    var yyyy = date.getFullYear();

    if(dd<10) {
        dd='0'+dd
    }

    if(mm<10) {
        mm='0'+mm
    }

    //Setting date variable in the required format
    date = yyyy+'-'+mm+'-'+dd;

    //Returning today's date
    return date;
}

//Pull data from Web API
function GetData() {
    //Nullify the Lab Data
    //This prevents stale data from being read later on
    LabData = null;
    var bSuccess = true;

    //Refresh lab information
    $.getJSON('https://webapp.essex.ac.uk/SignageAPI/api/PCLab/GetAllLabs', function (data) {
        //Push data into global object
        LabData = data;
    }).fail(function() {
        bSuccess = false;
    });

    //Check to see if the objects are as expected, and set the data accordingly
    if (bSuccess)
        LabUpdate = new Date();
}

//Refresh all content on the page
function RefreshPage() {
    //Are we 5-past the hour? Refresh
    var timeNow = new Date();
    var timeM = timeNow.getMinutes();
    var timeS = timeNow.getSeconds();

    if (timeM == 5 && timeS < 2)
        location.reload(true);

    //Tell JS to refresh the page data
    RefreshContent();
}


//Refresh the information held in the page's content
function RefreshContent() {

    //Check to see if the data payloads contain values
    if (LabData != null) {

        //Loop through each lab in the dataset
        $.each(LabData, function (i, Lab) {

            //ALL LAB INFORMATION
            try
            {
                //Initialising Variables For Efficiency
                var LabName = "#" + Lab.Shortname;
                var PCAv = Lab.PCAvailable;
                var PCTot = Lab.PCTotal;
                var $occupancy = $(LabName + " .col-md-5");
                var closed = Lab.ForceClose;
                var closeMessage = Lab.ForceCloseMessage;

                if (closed || !Lab.OpenNow) {
                    //Forced closed or normal closed
                    //Set correct classes on occupancy div - set to closed and to the colour red
                    $occupancy.removeClass("available").removeClass("closed").removeClass("booked").addClass("closed");

                    //Change .... to circle with a cross through it, indicating the lab is closed
                    $(LabName + " div:nth-child(2) div div:nth-child(1)").find('i').removeClass("fa fa-times-circle fa-4x").removeClass("fa fa-exclamation-circle fa-4x").removeClass("fa fa-check-circle fa-4x").addClass("fa fa-times-circle fa-4x");

                    //Hiding the lab status notes
                    $occupancy.find("p").hide();
                    $(LabName + " h2.text-right").hide();

                    //Set lab status
                    $occupancy.find("h4").text("Closed");

                    //Display status message
                    if (closed && closeMessage != null) {
                        //If the closing message is larger than 15 characters then display only the first 13
                        if (closeMessage > 15) {
                            $occupancy.find("p").text(closeMessage.substring(0,13) + "...").show();
                        } else {
                            $occupancy.find("p").text(closeMessage).show();
                        }
                    }

                    //Increasing width of div if occupancy doesn't need to be displayed
                    $(LabName + " .status").removeClass("col-md-5").removeClass("col-md-10").addClass("col-md-10");

                    //Hide occupancy div
                    $(LabName + " div:nth-child(2) div div:nth-child(3)").hide();

                } else if (Lab.BookedNow) {

                    //Booked
                    var BookFinish = Lab.BookingNow.FinishTime;
                    var BookInfo = Lab.BookingNow.Notes;
                    var BookDay = BookFinish.substring(8,10);
                    var CurrentDay = LabUpdate.getDate();
                    var displayDate = BookFinish.substring(8,10) + BookFinish.substring(4,8) + BookFinish.substring(0,4);

                    //Adding a 0 to the front of the current day if below 10
                    if (CurrentDay<10) {
                        CurrentDay = "0"+CurrentDay;
                    }

                    //Setting lab status to booked
                    $occupancy.find("h4").html("Booked&nbsp;Now");

                    //Set correct classes on occupancy div - colour
                    $occupancy.removeClass("available").removeClass("closed").removeClass("booked").addClass("booked");

                    //Change .... to circle with a cross through it, indicating the lab is booked
                    $(LabName + " div:nth-child(2) div div:nth-child(1)").find('i').removeClass("fa fa-times-circle fa-4x").removeClass("fa fa-exclamation-circle fa-4x").removeClass("fa fa-check-circle fa-4x").addClass("fa fa-exclamation-circle fa-4x");

                    //Shortening booking reason if too long
                    if (BookInfo != null && BookInfo.length > 15) {
                        BookInfo = BookInfo.substring(0,13) + "...";
                    }

                    //Set lab status
                    if (BookDay == CurrentDay) {
                        //If booking ends today display ending time.
                        if (BookInfo == "" || BookInfo == null) {
                            $occupancy.find("p").text("Booked until " + BookFinish.substring(11,16));
                        } else {
                            //Display booking information if any
                            $occupancy.find("p").text("Booked until " + BookFinish.substring(11,16) + " For " + BookInfo);
                        }
                    } else {
                        //If booking doesn't end today display date.
                        $occupancy.find("h4").html("Booked&nbsp;Now");
                        $occupancy.find("p").text("for " + BookInfo + " until " + displayDate);
                    }

                    //Increasing width of div if occupancy doesn't need to be displayed
                    $(LabName + " .status").removeClass("col-md-5").removeClass("col-md-10").addClass("col-md-10");

                    //Hide occupancy div
                    $(LabName + " div:nth-child(2) div div:nth-child(3)").hide();

                } else {
                    //Open

                    //Set correct classes on occupancy div - colour
                    $occupancy.removeClass("available").removeClass("closed").removeClass("booked").addClass("available");
                    $occupancy.find("h4").text("Available");
    
                    //PCs available
                    $(LabName + " .text-right").html(PCAv + "<span class='total'>/" + PCTot + "</span>");

                    /*
                    //Hack: if available larger than total then total = available
                    if (PCAv > PCTot) {
                        PCTot = PCAv;
                    }
                    */

                    //Hack: if available larger than total then available = total
                    if (PCAv > PCTot) {
                        PCAv = PCTot;
                    }

                    //Set text on occupancy div
                    $(LabName + " .col-md-5").find("p").text("No bookings").show();

                    //Change .... to circle with a cross through it, indicating the lab is closed
                    $(LabName + " div:nth-child(2) div div:nth-child(1)").find('i').removeClass("fa fa-times-circle fa-4x").removeClass("fa fa-exclamation-circle fa-4x").removeClass("fa fa-check-circle fa-4x").addClass("fa fa-check-circle fa-4x");

                    //Changing length of status ready to display lab occupancy
                    $(LabName + " .status").removeClass("col-md-5").removeClass("col-md-10").addClass("col-md-5");

                    //Show occupancy div
                    $(LabName + " div:nth-child(2) div div:nth-child(3)").show();

                    //Colour based on occupancy
                    if (PCAv <= 0) {
                        //Turn lab orange if at full capacity and display warning
                        $occupancy.removeClass("available").removeClass("closed").removeClass("booked").addClass("booked");
                        $occupancy.find("p").html("At capacity");
                    }
                    else if (PCAv <= 5) {
                        //Display near capacity warning
                        $occupancy.find("p").html("Near capacity");
                    }

                    var nextBooking = Lab.BookingNext;

                    //Displays the next lab booking if any fall on the current day
                    if (nextBooking != null) {
                        var startTime = nextBooking.StartTime;
                        var finishTime = nextBooking.FinishTime;
                        if (startTime.substring(0,10) == GetDate()) {
                            $(LabName + " .col-md-5").find("p").html("Booked:&nbsp;" + startTime.substring(11,16) + "&nbsp;-&nbsp;" + finishTime.substring(11,16));
                        }
                    }
                }

                //Printer check
                var any = false;
                var allStatus = LabName + " .good, " + LabName + " .bad, " + LabName + " .unknown";

                //Updating printer status
                $.each(Lab.Printers, function (i, Printer) {
                    var Status = Printer.Status;

                    //Printer exist = true
                    any = true;

                    //Setting printer status
                    if (Status == "Ok") {
                        $(allStatus).removeClass("bad").removeClass("unknown").removeClass("good").addClass("good");
                        $(LabName + " .good").html("<i class='fa-li fa fa-print'></i> Printer working");
                        //Breaking the for each loop if at least one printer is functional
                        return false;
                    } else if (Status == "Offline" || Status == "Out of paper" || Status == "Paper jam") {
                        $(allStatus).removeClass("good").removeClass("unknown").removeClass("bad").addClass("bad");
                        $(LabName + " .bad").html("<i class='fa-li fa fa-print'></i> Printer not working");
                    } else {
                        $(allStatus).removeClass("good").removeClass("bad").removeClass("unknown").addClass("unknown");
                        $(LabName + " .unknown").html("<i class='fa-li fa fa-print'></i> Printer status unknown");
                    }
                });

                //Output no printers found if none exist in lab
                if (!any) {
                    $(allStatus).removeClass("good").removeClass("bad").removeClass("unknown").addClass("unknown");
                    $(allStatus).html("<i class='fa-li fa fa-print'></i> No printers found...</li>");
                }

            } catch (err) {

            }

        });
    }
}