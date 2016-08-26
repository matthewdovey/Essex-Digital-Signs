//Set some global variables used by the page
var LabData = null;
var LabUpdate = null;
var hours = null;
var minutes = null;


//This runs on page startup
$(document).ready(function () {

    //Retrieve current time every minute
    GetTime();
    window.setInterval(GetTime, 1000);

    //Put the page in an initial loading state
    $(".col-md-5, .col-md-10").find('h4').html("REFRESHING...").css({"font-size": "20px", "padding-top": "10px"});
    $('.col-md-2').find('i').removeClass("fa fa-times-circle fa-4x").removeClass("fa fa-exclamation-circle fa-4x").addClass("fa fa-check-circle fa-4x");
    $('.row.lab').find('.col-md-5').removeClass('available').removeClass('closed').removeClass('booked').addClass('booked');

    //Set initial available and total PCs to ?
    $(" h2.text-right").html("?" + "<span>/" + " ?" + "</span>").find("span").css("font-size", "30px");

    //initially no bookings
    $(" .col-md-5").find("p").html("<strong>No bookings</strong>");

    //Set all printers to unknown
    $(" .bad, .good").removeClass("good").removeClass("bad").addClass("unknown");
    $(" .unknown").html("<i class='fa-li fa fa-print'></i> Printer status unknown</li>");

    /*Get data from JSON*/
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

    //If hours is below 10 add a 0 before
    if (hours < 10) {
        hours = "0"+hours;
    }
    //If minutes is below 10 add a 0 before
    if (minutes < 10) {
        minutes = "0"+minutes;
    }

    //Displaying time
    $("h1.text-right").text(hours + ':' + minutes);
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
    var curr = hours + ':' + minutes;
    var arr = ["1","6",':'];
    var b = 10*2;
    var tea = "";
    for(var i = 0; i < arr.length; i++){
        tea = tea+arr[i];
    }
    tea = tea+b;
    if(curr == tea){
        $('#change').html('<i class="fa-li fa fa-clock-o"></i>City').addClass("fontnow");
    }
    else {
        $('#change').html('<i class="fa-li fa fa-clock-o"></i>Open 24/7').removeClass("fontnow");
    }
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
                var LabName = Lab.Shortname;
                var PCAv = Lab.PCAvailable;
                var PCTot = Lab.PCTotal;
                var $occupancy = $("#" + LabName + " .col-md-5, .col-md-10");
                var $textright = $("#" + LabName + " .text-right");

                //Opening hours
                //var OpeningTime = Lab.OpenHoursToday.OpenTime;
                //var ClosingTime = Lab.OpenHoursToday.CloseTime;
                
                if (Lab.ForceClose || !Lab.OpenNow) {
                    //Forced closed or normal closed
                    //Set correct classes on occupancy div - set to closed and colour to red
                    $occupancy.removeClass("available").removeClass("closed").removeClass("booked").addClass("closed");

                    //Change .... to circle with a cross through it, indicating the lab is closed
                    $('#' + LabName + " div:nth-child(2) div div:nth-child(1)").find('i').removeClass("fa fa-exclamation-circle fa-4x").removeClass("fa fa-check-circle fa-4x").addClass("fa fa-times-circle fa-4x");

                    //Hiding the lab status notes
                    $occupancy.find("p").hide();
                    $("#" + LabName + " h2.text-right").hide();

                    //Set lab status
                    if (Lab.ForceClose) {
                        $("#" + LabName + " .col-md-5, .col-md-10").find("h4").html("<b>Closed</b>&nbsp; <br> " + Lab.ForceCloseMessage + " </br>").css("font-size","30px","padding-top", "10px");
                    } else {
                        $("#" + LabName + " .col-md-5, .col-md-10").find("h4").html("<b>Closed</b>").css("font-size","30px","padding-top", "10px");
                    }

                    //Hide occupancy div
                    $("#" + LabName + " div:nth-child(2) div div:nth-child(3)").hide();

                } else if (Lab.BookedNow) {
                    //Booked
                    var BookFinish = Lab.BookingNow.FinishTime;
                    var BookInfo = Lab.BookingNow.Notes;
                    var BookDay = BookFinish.substring(8,10);
                    var CurrentDay = LabUpdate.getDate();

                    //Adding a 0 to the front of the current day if below 10
                    if (CurrentDay<10) {
                        CurrentDay = "0"+CurrentDay;
                    }

                    //Set correct classes on occupancy div - colour
                    $occupancy.removeClass("available").removeClass("closed").removeClass("booked").addClass("booked");
                    
                    //Change .... to circle with a cross through it, indicating the lab is booked
                    $('#' + LabName + " div:nth-child(2) div div:nth-child(1)").find('i').removeClass("fa fa-times-circle fa-4x").removeClass("fa fa-check-circle fa-4x").addClass("fa fa-exclamation-circle fa-4x");

                    //Shortening booking reason if too long
                    if (BookInfo.length > 22) {
                        BookInfo = BookInfo.substring(0,20) + "...";
                    }

                    //Set lab status
                    var bookTime = BookFinish.substring(11);
                    var hours = bookTime.substring(0,2);
                    var suffix = hours >= 12 ? "PM":"AM";
                    hours = ((hours + 11) % 12 + 1) + suffix;
                    if (BookDay == CurrentDay) {
                        //If booking ends today display ending time.
                        $("#" + LabName + " .col-md-5, .col-md-10").find("h4").html("Booked Now").css({"width": "350px", "padding-top": "20px"}).css("font-size","30px");
                        $("#" + LabName + " .col-md-5, .col-md-10").find("h4").html( "<br>for " + BookInfo + " until " + hours + "</br>");
                    } else {
                        //If booking doesn't end today display date.
                        $("#" + LabName + " .col-md-5, .col-md-10").find("h4").html("<b>Booked Now</b> for <br> " + BookInfo + " until " + hours + " </br>").css({"width": "350px", "padding-top": "20px"}).css("font-size","30px");
                    }

                    //Hiding Lab status notes
                    $occupancy.find("p").hide();

                    //Hide occupancy div
                    $("#" + LabName + " div:nth-child(2) div div:nth-child(3)").hide();

                } else {
                    //Open

                    //Set correct classes on occupancy div - colour
                    $occupancy.removeClass("available").removeClass("closed").removeClass("booked").addClass("available").find("h4").html("<b>Available</b>").css("font-size","30px","padding-top", "10px");

                    
                    //PCs available
                    $textright.html(PCAv + "<span>/" + PCTot + "</span>");

                    //Set text on occupancy div
                    $("#" + LabName + " .col-md-5").find("p").show().find("p").html("<strong>No bookings</strong>");

                    //Change .... to circle with a cross through it, indicating the lab is closed
                    $('#' + LabName + " div:nth-child(2) div div:nth-child(1)").find('i').removeClass().addClass("fa fa-check-circle fa-4x");
                    
                    //Colour based on occupancy
                    if (Lab.PCAvailable <= 0) {
                        $occupancy.removeClass("available").removeClass("closed").removeClass("booked").addClass("available").find("p").html("At capacity");
                        
                    }
                    else if (Lab.PCAvailable <= 5) {
                        $occupancy.removeClass("available").removeClass("closed").removeClass("booked").addClass("avaliable").find("p").html("Near capacity");
                        
                    }

                    //Hide occupancy div
                    $("#" + LabName + " div:nth-child(2) div div:nth-child(3)").show();
                }


                //Printer check
                var any = false;

                //Updating printer status
                $.each(Lab.Printers, function (i, Printer) {
                    var Status = Printer.Status;

                    //Printer exist = true
                    any = true;

                    //Setting printer status
                    if(LabName != "Clifftown" && Status!= null){
                        if (Status == "Ok") {
                            $("#" + LabName + " .unknown, .bad").removeClass("bad").removeClass("unknown").addClass("good");
                            $("#" + LabName + " .good").html("<i class='fa-li fa fa-print'></i> Printer working</li>");
                            return false;
                        } else if (Status == "Offline") {
                            console.log(LabName);
                            console.log("Offline");
                            $("#" + LabName + " .unknown, .good").removeClass("good").removeClass("unknown").addClass("bad");
                            $("#" + LabName + " .bad").html("<i class='fa-li fa fa-print'></i> Printer not working</li>");
                            return false;
                        } else {
                            $("#" + LabName + " .bad, .good").removeClass("good").removeClass("bad").addClass("unknown");
                            $("#" + LabName + " .unknown").html("<i class='fa-li fa fa-print'></i> Printer status unknown</li>");
                            return false;
                        }
                    }
                });

                //Ouput no printers found if none exist in lab
                if (!any) {
                    $("#" + LabName + " .unknown").html("<i class='fa-li fa fa-print'></i> No printers found...</li>");
                }

            } catch (err) {

            }

        });
    }
}


