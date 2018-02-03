//let Homey;
let _myLog;
let surveillance;
let alarm;
var allDevices;
var triggerDelay = 30;
var logArmedOnly;
var logTrueOnly;
var dashboardVisible = true;

function onHomeyReady(homeyReady){
    Homey = homeyReady;
    Homey.ready();
    getTriggerDelay();
    getLogArmedOnly();
    getLogTrueOnly();
    getDelayArming();
    getSettings();
    getSpeechSettings();
    getLanguage();
    refreshHistory();

    new Vue({
        el: '#app',
        data: {
          devices: {},
          search: '',
          devicesMonitoredFull: [],
          devicesMonitoredPartial: [],
          devicesDelayed: [],
          devicesLogged: [],
          log: []
        },
        methods: {
            getMonitoredFullDevices() {
                Homey.get('monitoredFullDevices', (err, result) => {
                   console.log('getMonitoredFullDevices: ' + result);
                    if (result) {
                        this.devicesMonitoredFull = result;
                    }
                });
            },
            getMonitoredPartialDevices() {
                Homey.get('monitoredPartialDevices', (err, result) => {
                   console.log('getMonitoredPartialDevices: ' + result);
                    if (result) {
                        this.devicesMonitoredPartial = result;
                    }
                });
            },
            getDelayedDevices() {
                Homey.get('delayedDevices', (err, result) => {
                   console.log('getDelayedDevices: '+ result);
                    if (result) {
                        this.devicesDelayed = result;
                    }
                });
            },
            getLoggedDevices() {
                Homey.get('loggedDevices', (err, result) => {
                   console.log('getLoggedDevices: '+ result);
                    if (result) {
                        this.devicesLogged = result;
                    }
                });
            },
            getDevices() {
                Homey.api('GET', '/devices', null, (err, result) => {
                    if (err)
                        return Homey.alert('getDevices' + err);
                    var array = Object.keys(result).map(function (key) {
                        return result[key];
                    });
                    this.devices = array.filter(this.filterArray);
                });
            },
            async addMonitorFull(device) {
                var i;
                var addDeviceMonitorFull = true;
                for (i = 0; i < this.devicesMonitoredFull.length; i++) {
                    if (this.devicesMonitoredFull[i] && this.devicesMonitoredFull[i].id == device.id) {
                        addDeviceMonitorFull = false;
                    }
                }
                if ( addDeviceMonitorFull ) {
                   console.log('addMonitorFull: ' + device.id, device.name, device.class)
                    await this.devicesMonitoredFull.push(device);
                    await Homey.set('monitoredFullDevices', this.devicesMonitoredFull, (err, result) => {
                        if (err)
                            return Homey.alert(err);
                        }
                    )
                   console.log('addMonitorFull: ' + device.name + ' added to monitoredFullDevices');
                }
                this.removeLog(device);
            },
            async addMonitorPartial(device) {
                var i;
                var addDeviceMonitorPartial = true;
                for (i = 0; i < this.devicesMonitoredPartial.length; i++) {
                    if (this.devicesMonitoredPartial[i] && this.devicesMonitoredPartial[i].id == device.id) {
                        addDeviceMonitorPartial = false;
                    }
                }
                if ( addDeviceMonitorPartial ) {
                   console.log('addMonitorPartial: ' + device.id, device.name, device.class)
                    await this.devicesMonitoredPartial.push(device);
                    await Homey.set('monitoredPartialDevices', this.devicesMonitoredPartial, (err, result) => {
                        if (err)
                            return Homey.alert(err);
                        }
                    )
                   console.log('addMonitorPartial: ' + device.name + ' added to monitoredPartialDevices');
                }
                this.removeLog(device);
            },
            async addDelay(device) {
               console.log('addDelay: ' + device.id, device.name, device.class)
                await this.devicesDelayed.push(device);
                await Homey.set('delayedDevices', this.devicesDelayed, (err, result) => {
                    if (err)
                        return Homey.alert(err);
                    }
                )
               console.log('addDelay: Delay added to ' + device.name);
                var addMonitorNeeded = true;
                for (i = 0; i < this.devicesMonitoredPartial.length; i++) {
                    if (this.devicesMonitoredPartial[i] && this.devicesMonitoredPartial[i].id == device.id) {
                        addMonitorNeeded = false;
                    }
                }
                if ( addMonitorNeeded ) {
                    this.addMonitorFull(device);
                }
            },
            async addLog(device) {
               console.log('addLog: ' + device.id, device.name, device.class)
                await this.devicesLogged.push(device);
                await Homey.set('loggedDevices', this.devicesLogged, (err, result) => {
                    if (err)
                        return Homey.alert(err);
                    }
                )
               console.log('addLog: Logging added to ' + device.name);
                this.removeMonitorFull(device);
                this.removeMonitorPartial(device);
            },
            async removeMonitorFull(device) {
                var i;
                for (i = 0; i < this.devicesMonitoredFull.length; i++) {
                    if (this.devicesMonitoredFull[i] && this.devicesMonitoredFull[i].id == device.id) {
                        this.devicesMonitoredFull.splice(i, 1);
                    }
                }
                await Homey.set('monitoredFullDevices', this.devicesMonitoredFull, (err, result) => {
                    if (err)
                        return Homey.alert(err);
                   console.log('removeMonitorFull: ' + device.name + ' removed from monitoredFullDevices');
                })
                var removeDelayNeeded = true;
                for (i = 0; i < this.devicesMonitoredPartial.length; i++) {
                    if (this.devicesMonitoredPartial[i] && this.devicesMonitoredPartial[i].id == device.id) {
                        removeDelayNeeded = false;
                    }
                }
                if ( removeDelayNeeded ) {
                    this.removeDelay(device);
                }
            },
            async removeMonitorPartial(device) {
                var i;
                for (i = 0; i < this.devicesMonitoredPartial.length; i++) {
                    if (this.devicesMonitoredPartial[i] && this.devicesMonitoredPartial[i].id == device.id) {
                        this.devicesMonitoredPartial.splice(i, 1);
                    }
                }
                await Homey.set('monitoredPartialDevices', this.devicesMonitoredPartial, (err, result) => {
                    if (err)
                        return Homey.alert(err);
                   console.log('removeMonitorPartial: ' + device.name + ' removed from monitoredPartialDevices');
                })
                var removeDelayNeeded = true;
                for (i = 0; i < this.devicesMonitoredFull.length; i++) {
                    if (this.devicesMonitoredFull[i] && this.devicesMonitoredFull[i].id == device.id) {
                        removeDelayNeeded = false;
                    }
                }
                if ( removeDelayNeeded ) {
                    this.removeDelay(device);
                }
            },
            async removeDelay(device) {
                var i;
                for (i = 0; i < this.devicesDelayed.length; i++) {
                    if (this.devicesDelayed[i] && this.devicesDelayed[i].id == device.id) {
                        this.devicesDelayed.splice(i, 1);
                    }
                }
                await Homey.set('delayedDevices', this.devicesDelayed, (err, result) => {
                    if (err)
                        return Homey.alert(err);
                   console.log('removeDelay: Delay removed from' + device.name);
                })
            },
            async removeLog(device) {
                var i;
                for (i = 0; i < this.devicesLogged.length; i++) {
                    if (this.devicesLogged[i] && this.devicesLogged[i].id == device.id) {
                        this.devicesLogged.splice(i, 1);
                    }
                }
                await Homey.set('loggedDevices', this.devicesLogged, (err, result) => {
                    if (err)
                        return Homey.alert(err);
                   console.log('removeLog: Logging removed from: ' + device.name);
                })
            },
            isMonitoredFull(obj) {
                var i;
                for (i = 0; i < this.devicesMonitoredFull.length; i++) {
                    if (this.devicesMonitoredFull[i] && this.devicesMonitoredFull[i].id == obj.id) {
                        return true;
                    }
                }
                return false;
            },
            isMonitoredPartial(obj) {
                var i;
                for (i = 0; i < this.devicesMonitoredPartial.length; i++) {
                    if (this.devicesMonitoredPartial[i] && this.devicesMonitoredPartial[i].id == obj.id) {
                        return true;
                    }
                }
                return false;
            },
            isDelayed(obj) {
                var i;
                for (i = 0; i < this.devicesDelayed.length; i++) {
                    if (this.devicesDelayed[i] && this.devicesDelayed[i].id == obj.id) {
                        return true;
                    }
                }
                return false;
            },
            isLogged(obj) {
                var i;
                for (i = 0; i < this.devicesLogged.length; i++) {
                    if (this.devicesLogged[i] && this.devicesLogged[i].id == obj.id) {
                        return true;
                    }
                }
                return false;
            },
            filterArray(device) {
                if (device.class == "sensor" || device.class == "lock")
                return device
            }
        },
        mounted() {
            this.getLoggedDevices();
            this.getMonitoredFullDevices();
            this.getMonitoredPartialDevices();
            this.getDelayedDevices();
            this.getDevices();
        },
        computed: {
            filteredItems() {
                return this.devices          
            }
        }
      })
}

function showTab(tab){
    // clean this up!
    if( tab == "tab1") {
        document.getElementById("tab1").style="display:block";
        document.getElementById("tab2").style="display:none";
        document.getElementById("tab3").style="display:none";
        document.getElementById("tab4").style="display:none";
        document.getElementById("tab1b").className="tab tab-active";
        document.getElementById("tab2b").className="tab tab-inactive";
        document.getElementById("tab3b").className="tab tab-inactive";
        document.getElementById("tab4b").className="tab tab-inactive";
        dashboardVisible = true;
    }
    else if ( tab == "tab2" ) {
        document.getElementById("tab1").style="display:none";
        document.getElementById("tab2").style="display:block";
        document.getElementById("tab3").style="display:none";
        document.getElementById("tab4").style="display:none";
        document.getElementById("tab1b").className="tab tab-inactive";
        document.getElementById("tab2b").className="tab tab-active";
        document.getElementById("tab3b").className="tab tab-inactive";
        document.getElementById("tab4b").className="tab tab-inactive";
        dashboardVisible = false;
    }
    else if ( tab == "tab3" ) {
        document.getElementById("tab1").style="display:none";
        document.getElementById("tab2").style="display:none";
        document.getElementById("tab3").style="display:block";
        document.getElementById("tab4").style="display:none";
        document.getElementById("tab1b").className="tab tab-inactive";
        document.getElementById("tab2b").className="tab tab-inactive";
        document.getElementById("tab3b").className="tab tab-active";
        document.getElementById("tab4b").className="tab tab-inactive";
        dashboardVisible = false;
    }
    else if ( tab == "tab4" ) {
        document.getElementById("tab1").style="display:none";
        document.getElementById("tab2").style="display:none";
        document.getElementById("tab3").style="display:none";
        document.getElementById("tab4").style="display:block";
        document.getElementById("tab1b").className="tab tab-inactive";
        document.getElementById("tab2b").className="tab tab-inactive";
        document.getElementById("tab3b").className="tab tab-inactive";
        document.getElementById("tab4b").className="tab tab-active";
        dashboardVisible = false;
    }
}

function getSettings() {
    Homey.get('surveillanceStatus', function( err, surveillanceStatus ) {
        if( err ) return Homey.alert( err );
        surveillance = surveillanceStatus;
        if( surveillance == 'armed') {
            document.getElementById("surveillanceModeFull").className = "btn wide btn-active";
            document.getElementById("surveillanceModePartial").className = "btn wide btn-inactive";
        }
        else if( surveillance == 'partially_armed' ) 
        {
            document.getElementById("surveillanceModeFull").className = "btn wide btn-inactive";
            document.getElementById("surveillanceModePartial").className = "btn wide btn-active";
        }
        else {
            document.getElementById("surveillanceModeFull").className = "btn wide btn-inactive";
            document.getElementById("surveillanceModePartial").className = "btn wide btn-inactive";
        }
    })
    Homey.get('alarmStatus', function( err, alarmStatus ) {
        if( err ) return Homey.alert( err );
        alarm = alarmStatus;
        if( alarm) {
            document.getElementById("alarmMode").className = "btn wide btn-alarm";
        }
        else {
            if (triggerDelay != null) {
                document.getElementById("alarmMode").className = "btn wide btn-inactive";
            }
        }
    })
}

function getTriggerDelay() {
    Homey.get('triggerDelay', function ( err, savedTriggerDelay ) {
        if (triggerDelay != null) {
            triggerDelay = savedTriggerDelay;
        }
        else {
            triggerDelay = 30;
        }
        document.getElementById("triggerDelay").value = triggerDelay;
    })
}

function getLogArmedOnly() {
    Homey.get('logArmedOnly', function( err, logArmedOnly ) {
        if( err ) return Homey.alert( err );
        document.getElementById("logArmedOnly").checked = logArmedOnly;
    })
}

function getLogTrueOnly() {
    Homey.get('logTrueOnly', function( err, logTrueOnly ) {
        if( err ) return Homey.alert( err );
        document.getElementById("logTrueOnly").checked = logTrueOnly;
    })
}

function getDelayArming() {
    Homey.get('delayArming', function( err, delayArming ) {
        if( err ) return Homey.alert( err );
        document.getElementById("delayArming").checked = delayArming;
    })
}

function getSpeechSettings() {
    Homey.get('spokenAlarmCountdown', function( err, spokenAlarmCountdown ) {
        if( err ) return Homey.alert( err );
        document.getElementById("spokenAlarmCountdown").checked = spokenAlarmCountdown;
    })

    Homey.get('spokenArmCountdown', function( err, spokenArmCountdown ) {
        if( err ) return Homey.alert( err );
        document.getElementById("spokenArmCountdown").checked = spokenArmCountdown;
    })

    Homey.get('spokenSmodeChange', function( err, spokenSmodeChange ) {
        if( err ) return Homey.alert( err );
        document.getElementById("spokenSmodeChange").checked = spokenSmodeChange;
    })

    Homey.get('spokenAlarmChange', function( err, spokenAlarmChange ) {
        if( err ) return Homey.alert( err );
        document.getElementById("spokenAlarmChange").checked = spokenAlarmChange;
    })

    Homey.get('spokenMotionTrue', function( err, spokenMotionTrue ) {
        if( err ) return Homey.alert( err );
        document.getElementById("spokenMotionTrue").checked = spokenMotionTrue;
    })

    Homey.get('spokenDoorOpen', function( err, spokenDoorOpen ) {
        if( err ) return Homey.alert( err );
        document.getElementById("spokenDoorOpen").checked = spokenDoorOpen;
    })
}

function getLanguage() {
   console.log('language: ' + language);
    document.getElementById("instructions"+language).style.display = "inline";
}

function writeHistory(line) {
    let nu = getDateTime();
    let logNew = nu + surveillance + " || " + line;
    Homey.get('myLog', function(err, logging){
        if( err ) return console.error('writeHistory: Could not get history', err);
        if (logging != undefined) { 
            logNew = logNew+"\n"+logging;
        }
        Homey.set('myLog', logNew );
    })
    refreshHistory();
}

function changeTriggerDelay() {
    let newTriggerDelay = document.getElementById("triggerDelay").value;
   console.log('Triggerdelay: ' + newTriggerDelay)
    if (isNaN(newTriggerDelay) || newTriggerDelay < 0 || newTriggerDelay > 120) {
        document.getElementById("triggerDelay").value = triggerDelay;
        Homey.alert(Homey.__("tab2.settings.secondsFail") );
    } else {
        triggerDelay = newTriggerDelay
        Homey.set('triggerDelay', triggerDelay, function( err ){
            if( err ) return Homey.alert( err );
        });
        Homey.alert(Homey.__("tab2.settings.saveSucces"));
    }
}

function changeLogArmedOnly() {
    let newValue = document.getElementById("logArmedOnly").checked
    if ( newValue ) {
        Homey.set('logArmedOnly', true, function( err ){
            if( err ) return Homey.alert( err );
        })
    }
    else {
        Homey.set('logArmedOnly', false, function( err ){
            if( err ) return Homey.alert( err );
        })
    }
}

function changeLogTrueOnly() {
    let newValue = document.getElementById("logTrueOnly").checked
    Homey.set('logTrueOnly', newValue, function( err ){
        if( err ) return Homey.alert( err );
    });
}

function changeDelayArming() {
    let newValue = document.getElementById("delayArming").checked
    Homey.set('delayArming', newValue, function( err ){
        if( err ) return Homey.alert( err );
    });
}

function changeSpokenAlarmCountdown() {
    let newValue = document.getElementById("spokenAlarmCountdown").checked
   console.log(newValue)
    Homey.set('spokenAlarmCountdown', newValue, function( err ){
        if( err ) return Homey.alert( err );
    });
}

function changeSpokenArmCountdown() {
    let newValue = document.getElementById("spokenArmCountdown").checked
   console.log(newValue)
    Homey.set('spokenArmCountdown', newValue, function( err ){
        if( err ) return Homey.alert( err );
    });
}

function changeSmodeChanged() {
    let newValue = document.getElementById("spokenSmodeChange").checked
   console.log(newValue)
    Homey.set('spokenSmodeChange', newValue, function( err ){
        if( err ) return Homey.alert( err );
    });
}

function changeAlarmChanged() {
    let newValue = document.getElementById("spokenAlarmChange").checked
   console.log(newValue)
    Homey.set('spokenAlarmChange', newValue, function( err ){
        if( err ) return Homey.alert( err );
    });
}

function changeMotionTrue() {
    let newValue = document.getElementById("spokenMotionTrue").checked
   console.log(newValue)
    Homey.set('spokenMotionTrue', newValue, function( err ){
        if( err ) return Homey.alert( err );
    });
}

function changeDoorOpen() {
    let newValue = document.getElementById("spokenDoorOpen").checked
   console.log(newValue)
    Homey.set('spokenDoorOpen', newValue, function( err ){
        if( err ) return Homey.alert( err );
    });
}

function clearHistory(){
    Homey.set('myLog', '');
};

function downloadHistory(){
    download('Heimdall history.txt', document.getElementById('logtextarea').value);
};

function refreshHistory(){
    if ( dashboardVisible == true ) {
        if (document.getElementById("showRefresh").checked === true ){
            showHistory()
        }
        getSettings();
    }
  setTimeout(refreshHistory, 1000);
}

function showHistory(run) {
    if ( run == 0 ) {
        if (document.getElementById("showRefresh").checked === true ){
            document.getElementById("buttonRefresh").style = "display:none";
        } else {
            document.getElementById("buttonRefresh").style = "display:block";
        }
    }
   console.log("s: " + getDateTime())
    Homey.get('myLog', function(err, logging){
      if( err ) return console.error('showHistory: Could not get history', err);
      if (_myLog !== logging || run == 1 ){
        _myLog = logging
        // Need work here -> done!
        document.getElementById('logtextarea').value = logging;
        
        let color = ""
        let htmlstring = "" 
        let historyArray = logging.split("\n")
        let dark = false
        let headerstring = '<div class="rTableRow"><div class="rTableCell line rTableHead">' + Homey.__("tab1.history.date") + '</div><div class="rTableCell line rTableHead">' + Homey.__("tab1.history.time") + '</div><div class="rTableCell line rTableHead">' + Homey.__("tab1.history.smode") + '</div><div class="rTableCell line rTableHead">' + Homey.__("tab1.history.source") + '</div><div class="rTableCell line rTableHead">' + Homey.__("tab1.history.action") + '</div></div>'
      
        historyArray.forEach(element => {
            element = element.replace(/ \|\| /g,'</div><div class="rTableCell line">')
            if ( element != "") {
                if ( dark ) {
                    color = element.substr(0,3)
                    color = color.replace("-","d")
                    dark = false
                } else {
                    color = element.substr(0,3)
                    color = color.replace("-","l")
                    dark = true
                }
                element = element.substr(3, element.length - 3 )
                if (document.getElementById("useColors").checked === false){
                    color = ""
                }
                htmlstring = htmlstring + '<div class="rTableRow ' + color + '"><div class="rTableCell line">' + element + "</div></div>"
            }
        });
        htmlstring = headerstring + htmlstring
        document.getElementById('historyTable').innerHTML = htmlstring
      }
  });
 console.log("e: " + getDateTime())
}

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}

function getDateTime() {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var msec = ("00" + date.getMilliseconds()).slice(-3)

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return day + "-" + month + "-" + year + "  ||  " + hour + ":" + min + ":" + sec + "." + msec + "  ||  ";
}