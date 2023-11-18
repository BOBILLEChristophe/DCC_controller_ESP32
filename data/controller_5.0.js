//   Controller DCC++ permet de commander de logiciel DCC++ BASE STATION de Gregg E. Berman COPYRIGHT (c) 2013-2016

//   (©) 2016-2023 - Christophe BOBILLE
//   Ce programme est un logiciel libre ; vous pouvez le redistribuer et/ou le modifier
//   au titre des clauses de la Licence Publique Générale GNU, telle que publiée
//   par la Free Software Foundation ; soit la version 3 de la Licence,
//   ou (à votre discrétion) une version ultérieure quelconque.

//   Ce programme est distribué dans l'espoir qu'il sera utile,
//   mais SANS AUCUNE GARANTIE ; sans même une garantie implicite de
//   COMMERCIABILITE ou DE CONFORMITE A UNE UTILISATION PARTICULIERE.
//   Voir la Licence Publique Générale GNU pour plus de détails.
//   Vous devriez avoir reçu un exemplaire de la Licence Publique Générale
//   GNU avec ce programme ; si ce n'est pas le cas, voyez http://www.gnu.org/licenses


//   This program is free software: you can redistribute it and/or modify
//   it under the terms of the GNU General Public License as published by
//   the Free Software Foundation, either version 3 of the License, or
//   (at your option) any later version.

//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.

//   You should have received a copy of the GNU General Public License
//   along with this program.  If not, see http://www.gnu.localorg/licenses
//   GNU General Public License:  http://opensource.org/licenses/GPL-3.0



//********* Controller DCC++
//***** v 2.2       - le 06/09/2016 à 19:03:00
//***** v 2.3       - le 27/12/2016 à 09:38:00
//***** v 2.4 (release) - le 29/01/2017 à 01:23:00
//***** v 2.5 (release) - le 29/01/2017 à 09:15:00
//***** v 2.6 (release) - le 29/01/2017 à 13:56:00
//        1° - Ajout d'une fenêtre de confirmation pour annuler la lecture de CV's en cas de problème.
//          Message reçu de DCC++ Base Station de type "<r123|123|1 -1>" avec -1 en fin.
//        2° - Arret de la loco si tentative de modifier la CV 1 (adresse) sur la voie principale alors
//          que la vitesse est > 0.
//***** v 2.7 (release) - le 30/01/2017 à 12:29:00
//        1° - Ajout de fonctionnalités concernant la gestion des CV's comme l'ajout automatique des noms et labels
//        2° - Ajout du n° de version en haut de page
//        3° - Ajout d'une zone rétractable de paramètrage en haut de page
//        4° - Ajout d'options dans cette zone
//            * Selection de l'adresse IP de l'Arduino supportant DCC++ Base Station par menu déroulant.
//          * Choix du nombre de CV's à lire par menu déroulant.
//          * Ajout de plusieurs fonctions liées aux sauvegardes
//        5° La zone "Noms pour les fonctions :" dans les paramètrages de foncions à été rendue rétractable
//***** v 2.8 (release) - le 02/02/2017 à 19:52:00
//        Ajout de "dccpp" dans les URL's des requêtes destinées à DCC++ Base Station pour être compatible
//***** v 2.8.1 (release) - le 04/02/2017 à 21:23:00
//        Ajout d'un objet manufacturers contenant les informations relatives au fabricants de décodeurs
//        Ajout d'un objet cvLabels contenant les informations relatives aux labels des CV's
//        ********  ATTENTION ******** Le fichier "data.json" a été renommé "locos.json"
//        et se touve maintenant placés dans le répertoire "config".
//***** v 2.8.2 à 2.8.5 (release) - le 21/02/2017 à 08:47:00
//        Nombreuses évolutions liées à la lecture des cv's et à leur programmation
//***** v 3.0 R1 BETA - le 22/02/2017 à 18:21:00 Version on-line démo
//***** v 3.0.1 R1 BETA - le 02/11/2017 à 10:02:00 Version desktop et serveur full
//***** v 4.0 R5 BETA (Version pour Node.js) - le 07/11/2017 à 08:10:00
//
//    Cette version permet de communiquer par TCP avec DCC++ via un serveur Node.js
//      Elle permet de piloter la carte Arduino (DCC++ BaseStation) via le port série ou ethernet.
//    Dans le première cas, les fonctions de lecture de CV's ne sont pas disponibles.
//      Configuration requise :
//      -  NodeJs : dccpp_node.js
//      -  Liaison série USB : Arduino Uno ou Mega
//      -  Liaison ethernet : Arduino Mega + shield ethernet
//      -  DCC++ BaseStation version originale DCCpp_Uno : https://github.com/DccPlusPlus/BaseStation
//    -  Arduino Motor Shield ou Pololu Dual MC33926 Motor Shield
//
//      Documentation DCC++ : https://github.com/DccPlusPlus/BaseStation/wiki/Getting-Started-With-DCC---Hardware
//
//***** v 4.1 (release) (Version pour Node.js) - le 22/11/2017 à 17:31:00
//          Correction de bugs
//          Ajout du Full Screen
//          Version sm pour tablettes et smartphones
//          Sauvegarde de paramétres sur disque via Node.js
//
//***** v 4.2 (release) (Version pour Node.js) - le 27/11/2017 à 19:32:00
//          Correction de bugs sur serialPort
//          Améliorations sur la version smartphone
//          Affichage d'informations supplémentaires dans le terminal
//s
//***** v 4.2.1 (release) (Version pour Node.js) - le 06/08/2021 à 19:32:00
//          Correction de bugs mineurs
//***** v 4.3.0 (release) (Version pour Node.js) - le 09/03/2022 à 11:00:00
//          Importantes modification pour la lecture des CVs
//***** v 4.3.1 (release) (Version pour Node.js) - le 15/03/2023 à 12:56:00
//          Modification de la fonction eStop (emergency)
//
//***** v 5.0 (release) (Version déstinée à être chargée en mémoire flash d'un ESP32)
//
//***************************************************************************************************************************




var trainsApp = angular.module('trainsApp', []);
trainsApp.controller('pilotLocosCtrl', function ($scope, $http, $filter, $timeout, $rootScope, $window, $q) {


  //*******************************************************************************************//
  //*********** Déclaration et initialisation de variables globales et parametrages ***********//
  //*******************************************************************************************//


  // Num version
  $scope.numVersion = "5.0";
  $scope.responseServer = 'Trying to open a WebSocket connection...';
  console.log('Trying to open a WebSocket connection...');

  var gateway = 'ws://'+window.location.hostname+'/ws';
  var ws = new WebSocket(gateway);

  ws.onclose = (event)=>
  {
    console.log('Connection closed');
    $scope.responseServer = 'Connection closed';
  }
  

  ws.onopen = ()=>
  {
    console.log('Websocket connected');
    $scope.$apply(()=>
    {
      $scope.connected = true;
      $scope.responseServer = 'Websocket connected';
    });
  };

  ws.onmessage = (event)=>
  {
    let obj = JSON.parse(event.data);
    $scope.$apply(()=>
    {
      if(obj.type === 0)
      {
        $scope.responseServer = obj.value;
        $scope.parseMsg(obj.value);
      }
      if(obj.type === 1)
        $scope.currentValue = obj.value;
    });
    // console.log("event.data : "+event.data);
    // console.log("event.type : "+obj.type);
    // console.log("event.value : "+obj.value);
    $timeout($scope.clearAfficheResponse, $scope.param.responseDislayTimeout);
  };

  $scope.sendMessage = (message)=>
  {
    ws.send(message);
  };

  // Création de l'objet locomotives qui est vide pour l'instant
  $scope.locomotives = null;
  // Création de l'objet locoSelectionnee qui est vide pour l'instant
  $scope.locoSelectionnee = null;
  // Création de l'objet manufacturers qui est vide pour l'instant
  $scope.manufacturers = null;
  // Création de l'objet cvLabels qui est vide pour l'instant
  $scope.cvLabels = null;
  // Création de l'objet param qui est vide pour l'instant
  $scope.param = null;
  // Valeurs par défaut de l'adresse (cv 1)
  $scope.numNewAdress = 3;
  // Initialisation de la variable keyOfLastId (dernière Id attribuée )
  $scope.keyOfLastId = 0;
  // Etat de l'alimentation du réseau
  $scope.powerStatus = false;

  // Initialisation des fenêtres
  $scope.showLocomotives        = true;
  $scope.showLocosIcons         = true;
  $scope.showLocosListe         = false;
  $scope.showLocoSelectionnee   = false;
  $scope.showParametrages       = false;

  $scope.dccpp_maxMainRegisters = 50;

  $scope.gauge = new RadialGauge({
    renderTo: 'gauge-id',
    width: 250,
    height: 250,
    units: 'Km/h',
    title: false,
    value: 0,
    minValue: 0,
    maxValue: 160,
    valueDec: 0,
    majorTicks: ["0","10","20","30","40","50","60","70","80","90","100","110","120","130","140","150","160"],
    minorTicks: 10,
    strokeTicks: false,
    highlights: [
    { "from":0,   "to": 120, "color": "#706050" },
    { "from":120, "to": 140, "color": "#FFA000" },
    { "from":140, "to": 160, "color": "#D04040" }
    ],
    colorPlate: '#ffffff',
    colorMajorTicks: '#bcbcbc',
    colorMinorTicks: '#bcbcbc',
    colorTitle: '#FFFFFF',
    colorUnits: '#808080',
    colorNumbers: '#7e7e7e',
    colorBorderInner: '#000000',
    colorNeedle: 'rgba(240, 128, 128, 1)',
    colorNeedleEnd: 'rgba(255, 160, 122, .9)',
    valueBox: false,
    animationRule: 'bounce',
    animationDuration: 100,
    listeners: {
      //value: function(newValue, oldValue) {
        // do something
      //},
      animationEnd: function()
      {
        $scope.gauge.value = $scope.locoSelectionnee.vitesse;
      }
  }
});

  // ********* Paramètres par défaut *********************************************************************//


  // Path des fichiers de config
  $scope.tab_pathConfigFiles = ['locos.json',
                                'manufacturers.json',
                                'cvLabels.json',
                                'param.json'
                               ];


  //*******************************************************************************************//
  //************************************** Ecouteurs ******************************************//
  //*******************************************************************************************//


  document.getElementById('btn_power').addEventListener('click', ()=>
  {
    $scope.$apply(function() {
      $scope.power();
    });
  });

  document.getElementById('btn_fullScreen').addEventListener('click', ()=>
  {
    $scope.$apply(function() {
      var el = document.documentElement,
          rfs = el.requestFullscreen
                || el.webkitRequestFullScreen
                || el.mozRequestFullScreen
                || el.msRequestFullscreen
                ;
      rfs.call(el);
    });
  });

  document.getElementById('btn_eStop').addEventListener('click', ()=>
  {
    $scope.$apply(function() {
      $scope.eStop();
    });
  });

  document.getElementById('btn_localStorageActive').addEventListener('click', ()=>
  {
    $scope.$apply(function() {
      $scope.param.localStorageActive = !$scope.param.localStorageActive;
    });
  });

  document.getElementById('addLoco').addEventListener('click', ()=>
  {
    $scope.$apply(function() {
      $scope.addLoco(3);
    });
  });

  document.getElementById('btn_stop').addEventListener('click', ()=>
  {
    $scope.$apply(function() {
      $scope.stopLoco();
    });
  });

  document.getElementById('btn_AR').addEventListener('click', ()=>
  {
    $scope.$apply(function() {
      $scope.goAr();
    });
  });

  document.getElementById('btn_AV').addEventListener('click', ()=>
  {
    $scope.$apply(function() {
      $scope.goAv();
    });
  });


  // document.getElementById('speedSlider').addEventListener('mousemove', ()=>
  // {
  //   $scope.$apply(function() {
  //     $scope.setTraction();
  //   });
  // });



  //*******************************************************************************************//
  //*************************** Selection locos et affichage locos ****************************//
  //*******************************************************************************************//


  // La méthode "selectionLoco" affecte à l'objet "locoSelectionnee" les informations de la locomotive sélectionnée
  $scope.selectionLoco = (loco)=>
  {
    $scope.locoSelectionnee = loco;
    $scope.showLocoSelectionnee = true;
    $scope.showParametrages = true;
    $scope.gauge.value = loco.vitesse;
  }


  // La méthode showLocos permet de choisir le mode d'affichage des locos
  $scope.showLocos = (origin)=>
  {
    if (origin == "icons")
    {
      if ($scope.showLocosListe)
      {
        $scope.showLocosIcons = true;
        $scope.showLocosListe = false;
      }
    }
    else
    {
      if ($scope.showLocosIcons)
      {
        $scope.showLocosIcons = false;
        $scope.showLocosListe = true;
      }
    }
  }



  //*******************************************************************************************//
  //******************************** Pilotage des locos ***************************************//
  //*******************************************************************************************//


  // Fonctions traction
  $scope.setTraction = ()=>
  {
    var data = "t ";
    data += $scope.locoSelectionnee.id;
    data += " ";
    data += $scope.locoSelectionnee.address;
    data += " ";
    data += $scope.locoSelectionnee.vitesse;
    data += " ";
    data += $scope.locoSelectionnee.sens;
    $scope.setParamLocos(data);
    $scope.gauge.value = $scope.locoSelectionnee.vitesse;
  }

  // Bouton arret
  $scope.stopLoco = ()=>
  {
    $scope.locoSelectionnee.vitesse = 0;
    $scope.setTraction();
    $("#speedSlider").focus();
  }

  // Bouton marche AR
  $scope.goAr = ()=>
  {
    if ($scope.locoSelectionnee.sens == 1) {
      $scope.locoSelectionnee.sens = 0;
      $scope.setTraction();
      $("#speedSlider").focus();
    }
  }

  // Bouton marche AV
  $scope.goAv = ()=>
  {
    if ($scope.locoSelectionnee.sens == 0) {
      $scope.locoSelectionnee.sens = 1;
      $scope.setTraction();
      $("#speedSlider").focus();
    }
  }


  //*******************************************************************************************//
  //******************* Activation ou désactivation des fonctions *****************************//
  //*******************************************************************************************//

  $scope.setFn = function(n)
  { // OPERATE ENGINE DECODER FUNCTIONS F0-F28
    var res = 0;
    var arg = 0;
    var data = "f"; // <f CAB BYTE1 [BYTE2]>
    data += " ";
    data += $scope.locoSelectionnee.address;
    data += " ";

    for ( var i = 0; i < arguments.length; i++)
    {
      $scope.locoSelectionnee.fn[arguments[i]] = $scope.locoSelectionnee.btn_fn[arguments[i]] ? Math.pow(2, i) : 0;
      res += $scope.locoSelectionnee.fn[arguments[i]];
    }
    switch (n)
    {
      case 0:
        data += 128 + res;
        break;
      case 5:
        data += 176 + res;
        break;
      case 9:
        data += 160 + res;
        break;
      case 13:
        data += 222;
        data += " ";
        data += res;
        break;
      case 21:
        data += 223;
        data += " ";
        data += res;
        break;
    }
    $scope.setParamLocos(data);
  }




  //*******************************************************************************************//
  //******************* Création et suppression de locos *****************************//
  //*******************************************************************************************//

  // Création d'une nouvelle loco
  $scope.nouvelleLoco = null;
  $scope.addLoco = (x)=>
  {
    return $q(function() {
      if (x == undefined)
        x = 3;
      $scope.keyOfLastId++;
      var newId = $scope.keyOfLastId;
      $scope.nouvelleLoco = {
        id: newId,
        address: x,
        nomCourt: "Nouvelle loco",
        nomLong: "",
        urlImg: "img/unknown.jpg",
        vitesse: 0,
        cvVolSon: 0,
        volumeSon: 0,
        cv29bit: [],
        cv29bit5: 0,
        newCV17val: 0,
        newCV18val: 0,
        newLongAddressVal: 0,
        sens: 1,
        fn: [],
        btn_fn: [],
        btn_fn_label: ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        "fn0to4": 0,
        "fn5to8": 0,
        "fn9to12": 0,
        "fn13to20": 0,
        "fn21to28": 0,
        cv: [
          {"key":0, "name":"", "label":"", "value": 0, "valHex":"", "valBin":""},
          {"key": 1, "name": "Adresse", "label": "Adresse", "value": x, "valHex": "", "valBin": ""}
        ]
      }
      $scope.locomotives.push($scope.nouvelleLoco);
      $scope.createCv($scope.locomotives.length - 1, 0, 1);
      $scope.showLocosIcons = false;
      $scope.showLocosListe = true;
    });
   $scope.nouvelleLoco = null;
  }


  // Supprimer une loco
  $scope.deleteLoco = function(obj, loco) {
    $scope.selectionLoco(obj);
    if (confirm("Voulez-vous supprimer la loco : \"" + loco + "\" ?")) {
      $scope.locomotives.splice($scope.locomotives.indexOf(obj), 1);
      $scope.locoSelectionnee = null;
      $scope.showLocoSelectionnee = false;
      $scope.showParametrages = false;
    }
  }


  //*******************************************************************************************//
  //********************************************* CV's ****************************************//
  //*******************************************************************************************//

  $scope.parseCv = (response) => {
    let temp = response.substring(response.indexOf("<") + 1, response.indexOf(">"));
    temp = temp.substring(9);
    let spaceIndex = temp.indexOf(" ");
    let cv = Number(temp.substring(0, spaceIndex));
    let value = Number(temp.substring(spaceIndex + 1));
    $scope.parseCv0(cv, value);
  }


  $scope.parseCv0 = (cv, value) => {
    var indexTabLocos = null;
    console.log(cv);
    console.log(value);
    if (value < 0) { // La valeur renvoyée est négative, problème de lecture
      $scope.afficheReponse("Lecture cv " + cv + " erronée !");
      return;
    }
    else {
      if (cv === 1)
        cv1 = value;

      function trouveCv(objLoco) {
        return objLoco.cv[1].value == cv1;
      }
      // Création d'un objet vide
      var obj = null;
      // Chercher dans obj locomotives si la CV existe
      obj = $scope.locomotives.find(trouveCv);
      if (obj === undefined || obj === null) {
        var promise = $scope.addLoco(cv1); // Création de la loco
        obj = $scope.locomotives.find(trouveCv);
      }

      obj.cv[cv].value = value;
      obj.cv[cv].valHex = $scope.convertHex(value);;
      obj.cv[cv].valBin = $scope.convertBin(value);

      if (obj.cv[cv]['label'] == "") {
        if ($scope.cvLabels[cv] != undefined)
          obj.cv[cv]['label'] = $scope.cvLabels[cv]["label"];
      }

      switch (cv) {
        case 8:
          obj.cv[8]['label'] = "Manufacturer ID : " + $scope.getManufacturers(value);
          break;
        case 17:
          obj.newCV17val = obj.cv[17].value;
          break;
        case 18:
          obj.newCV18val = obj.cv[18].value;
          break;
        case 29:
          obj.newLongAddressVal = 0;
          for (let i = 0; i < 8; i++) {
            if (obj.cv[29].valBin.substring(i, i + 1) == 1)
              obj.cv29bit[7 - i] = true;
            else
              obj.cv29bit[7 - i] = false;
          }
          if (obj.cv29bit[5] == true) {
            obj.address = ((obj.cv[17].value - 192) * 256) + obj.cv[18].value;
            obj.newLongAddressVal = obj.address;
          }
          break;
      }// End switch
    }
  }


  var cv1 = 0;
  // $scope.readCv = async function(start, end) {

  //   if (start > 0 && end >= start) {

  //     const tabCvs = await fetch($scope.urlServProg+'?start=' + start + '&end=' + end)
  //                    .then(resultat => resultat.json());
  //     //console.log(tabCvs);
  //     for (let i = 0; i < tabCvs.length; i++) {
  //       const obj = tabCvs[i];
  //       //console.log(obj);
  //       let cv = obj.ID;
  //       let value = obj.valeur;
  //       $scope.parseCv0(obj.ID, obj.valeur);
  //     }
  //     alert('Fin de lecture cv');
  //   }
  //   else
  //     $scope.afficheReponse("cv's non renseignées !");
  // }

  $scope.readCv = (start, end) =>
  {
    if(start > 0 && end >= start) {
      //if($scope.powerStatus === true) {
        // On lit en premier les cv's 1, 17, 18, et 29 pour savoir s'il s'agit d'une adresse
        // courte ou longue et connaitre la valeur de l'adresse
        
        // $scope.socket.emit('readCv', '<R 1 123 123>');
        // $scope.socket.emit('readCv', '<R 17 123 123>');
        // $scope.socket.emit('readCv', '<R 18 123 123>');
        // $scope.socket.emit('readCv', '<R 29 123 123>');
        
        if (start == 1) // La cv 1 a déjà été scanée
          start = 2;

        for (let i = start; i <= end; i++) {
          var data =   "<R "+i+" 123 123>";
          //$scope.sendReq(data);

/*__MODIF_16_03_23__start
 $scope.socket.emit('readCv', data);
__MODIF_16_03_23__end*/
         
          //$timeout($scope.sendReq(data), 1000);
        } // End for
      //}
      //else
        //$scope.afficheReponse("Alimentation coupée !");  
      //End if($scope.powerStatus === true)
    }
    else
      $scope.afficheReponse("cv's non renseignées !");
    // End if(start > 0 && end > 0) 
  }


  // Recherche du constructeur du décodeur pour MAJ CV 8
  $scope.getManufacturers = function (x) {
    function searchManufacturer(manufacturerId) {
      return manufacturerId.id == x;
    }
    // création d'un objet vide
    var obj = null;
    // chercher dans obj si la key existe
    obj = $scope.manufacturers.find(searchManufacturer);
    if (obj === undefined) return "";
    else return obj.manufacturer;
  }


  $scope.createCv = (x, start, end)=>
  {
    // Création des CVs qui n'existent pas pour chaque loco
    for ( let i = start; i <= end; i++ ) {
      function trouveCv(objLoco) {
        return objLoco.key == i;
      }
      // Création d'un objet vide
      var obj = null;
      // Chercher dans obj locomotives si la CV existe
      obj = $scope.locomotives[x].cv.find(trouveCv);
      if (obj === undefined) { // La CV n'existe pas
        $scope.newCv = {
          key: i,
          name: "",
          label: "",
          value: 0,
          valHex: "",
          valBin: ""
        }
        $scope.locomotives[x].cv.push($scope.newCv);
      } // -> if
    }
  }




  //*******************************************************************************************//
  //***************************** Modification des CV's ***************************************//
  //*******************************************************************************************//


  // Changement d'adresse
  $scope.setNewAdressCourte = function()
  {
    //$scope.setCv(1, $scope.numNewAdress);
    $scope.locoSelectionnee.address = $scope.numNewAdress;

    $scope.locoSelectionnee.cv[1]['value'] = $scope.numNewAdress;
    $scope.locoSelectionnee.cv[1]['valHex'] = $scope.convertHex($scope.numNewAdress);
    $scope.locoSelectionnee.cv[1]['valBin'] = $scope.convertBin($scope.numNewAdress);
    if ($scope.locoSelectionnee.cv[1].label == "")
      $scope.locoSelectionnee.cv[1].label = "Adresse";
  }


  // Conversion en Hexadécimal
  $scope.convertHex = (val)=>
  {
    val = Number(val);
    let hex = val.toString(16);
    if (hex.length == 1) {
      hex = "0x0" + hex
    }
    else {
      hex = "0x" + hex
    }
    return hex;
  }

  // Conversion en Binaire
  $scope.convertBin = (val)=>
  {
    val = Number(val);
    let bin = val.toString(2);
    for ( let i = bin.length; i < 8; i++)
      bin = "0" + bin;
    return bin;
  }



  //*******************************************************************************************//
  //****************************** Tri de la liste des locos selon CV's ***********************//
  //*******************************************************************************************//

  $scope.champTri = null;
  $scope.triDescendant = false;
  $scope.triLocos = function(champ)
  {
    if ($scope.champTri == champ)
      $scope.triDescendant = !$scope.triDescendant;
    else
    {
      $scope.champTri = champ;
      $scope.triDescendant = false;
    }
  }

  $scope.cssChevronsTri = (champ)=>
  {
    return {
      glyphicon: $scope.champTri == champ,
      'glyphicon-chevron-up' : $scope.champTri == champ && !$scope.triDescendant,
      'glyphicon-chevron-down' : $scope.champTri == champ && $scope.triDescendant
    };
  }




  //*******************************************************************************************//
  //****************************** Requêtes httpReq et sockets ********************************//
  //*******************************************************************************************//


  // Préparation de la requette
  $scope.setParamLocos = (data)=>
  {
    data =  "<"
            + data
            + ">";
    $scope.sendReq(data); //... et on appele la fonction qui va envoyer l'information à DCC++
  }

  // Affichage de la réponse pour les requettes http
  $scope.afficheReponse =  (response)=>
  {
    $scope.responseServer = response;
    if (null != $scope.param)
      $timeout($scope.clearAfficheResponse, $scope.param.responseDislayTimeout);   // ... pendant x secondes
    else
      $timeout($scope.clearAfficheResponse, 3000);
  }


  // Affichage de la réponse pour les requettes
  $scope.afficheReponseServ = (response)=>
  {
    let indexQ = response.indexOf("\n");
    if (indexQ == 0)
      response = response.substring(1);
    indexQ = response.indexOf("\n");
    if (indexQ > 0)
      response = response.substring(0, indexQ);
    indexQ = response.indexOf("r123|123|");
    if (indexQ > 0)
      $scope.parseCv(response);
    else
      $scope.parseMsg(response);

    $scope.$apply(function() {
      $scope.responseServer = response;
    });
    if (null != $scope.param) {
      $timeout($scope.clearAfficheResponse, $scope.param.responseDislayTimeout);   // ... pendant x secondes
    }
    else {
      $timeout($scope.clearAfficheResponse, 3000);
    }
  }

  $scope.parseMsg = (response)=>
  {
    switch (response) {
      case "<p0>":
        $scope.powerStatus = false;
        break;
      case "<p1>":
        $scope.powerStatus = true;
        break;
    }
  }


  $scope.clearAfficheResponse = ()=>
  {
    $scope.responseServer = "";
  }


  // Envoi de requette
  $scope.sendReq = (data)=>
  {
    console.log("Sending message "+ data);
    //__MODIF_16_03_23__start
    $scope.sendMessage(data);
    //$scope.sendMessage('message', data);
    //__MODIF_16_03_23__end
  }


  //*******************************************************************************************//
  //*************************************** eStop ********************************************//
  //*******************************************************************************************//


  // Arret immediat de toutes les locomotives
  $scope.eStop = ()=>
  {
     $scope.sendReq("<!>");
   for (var x in $scope.locomotives)
    $scope.locomotives[x].vitesse = 0;
   $scope.gauge.value = 0;
  }


  //*******************************************************************************************//
  //******* Initialisation de certaines valeurs de l'objet "locomotives" au chargement ********//
  //*******************************************************************************************//


  $scope.initLoco = ()=>
  {
    for (var x in $scope.locomotives) {
      $scope.locomotives[x].vitesse = 0;
      $scope.locomotives[x].sens = 1;
      $scope.locomotives[x].id = Number(x) + 1;
    }

    if (x > -1)
      $scope.keyOfLastId = $scope.locomotives[x].id;

    if (x > $scope.dccpp_maxMainRegisters)
      alert("Le nombre de registres dans DCC++ est de " + $scope.dccpp_maxMainRegisters + " par défaut.\r\rPensez à modifier votre programme DCC++.");
  }



  //*******************************************************************************************//
  //************************* Mise sous tension ou coupure du réseau **************************//
  //*******************************************************************************************//


  // Methode pour mettre le réseau sous tension...
  $scope.power = ()=>
  {
    var tempValue = !$scope.powerStatus;
    var data = "<" + Number(tempValue) + ">";

    if (tempValue === true) {
      $scope.sendReq(data); // Power on..
      $scope.sendReq("<!>");// ...puis toutes les locos sont mises à l'arret (fonction emmergency de DCC).
      $scope.initLoco();
    }
    else
      $scope.sendReq(data); //... ou power off
  }



  //***************************************************************************************************************//
  //********************************** Chargement des données *****************************************************//
  //***************************************************************************************************************//


  //**************************** Chargement du fichier locomotives à partir du menu paramètres *********************//

  $scope.loadLocosHd2 = ()=>
  {
    if (confirm("Vous allez effacer les données actuelles de vos locomotives, voulez-vous poursuivre ?")) {
      var promise = $scope.loadLocosHd();
      promise.then(
      function(resolve)
      {
        $scope.afficheReponse("Success import file \"locos.json\" from HD.");
        $scope.initLoco();
      });
    }
  }


  //********************************** à partir du localstorage ***************************************************//

  $scope.loadLocalStorage = ()=>
  {
    $scope.locomotives = JSON.parse(localStorage.getItem("locomotives"));
    $scope.param = JSON.parse(localStorage.getItem("param"));
    $scope.manufacturers = JSON.parse(localStorage.getItem("manufacturers"));
    $scope.cvLabels = JSON.parse(localStorage.getItem("cvLabels"));
    $scope.localStorageLength = localStorage.length;
  }

  //********************************** à partir du HD ***************************************************//

  // Chargement de l'objet "locomotives" (qui contient toutes les infos sur les locos) à partir du HD
  $scope.loadLocosHd = ()=>
  {
    return $q((resolve, reject)=> {
      $http({
        method: 'GET',
        url: './' + $scope.tab_pathConfigFiles[0]
      }).
      success((response)=>
      {
        $scope.locomotives = response;
        resolve(response);
        console.log("Fichier des locomotives sur disque chargé.");
      }).
      error((data, status, headers, config)=>
      {
        reject(data, status, headers, config);
        console.log("Erreur de chargement du fichier des locomotives sur disque.");
        console.log(data);
      });
    });
  }


  // Chargement du fichier des constructeurs de décodeurs à partir du HD
  $scope.loadManufacturersHd = ()=>
  {
    return $q((resolve, reject)=>
    {
      $http({
        method: 'GET',
        url: './' + $scope.tab_pathConfigFiles[1]
      }).
      success((response)=>
      {
        $scope.manufacturers = response;
        resolve(response);
        console.log("Fichier des constructeurs sur disque chargé.");
      }).
      error((data, status, headers, config)=>
      {
        reject(data, status, headers, config);
        console.log("Erreur de chargement du fichier des constructeurs sur disque.");
        console.log(data);
      });
    });
  }

  // Chargement du fichier des labels pour les CV's de décodeurs à partir du HD
  $scope.loadCvLabelsHd = ()=>
  {
    return $q(function(resolve, reject)
    {
      $http({
method: 'GET',
url: './' + $scope.tab_pathConfigFiles[2]
      }).
      success(function(response)
      {
        $scope.cvLabels = response;
        resolve(response);
        //$scope.afficheReponse("Fichier des labels de CV's sur disque chargé.");
      }).
      error(function(data, status, headers, config)
      {
        reject(data, status, headers, config);
        console.log(data);
      });
    });
  }

  // Chargement du fichier des labels pour les CV's de décodeurs à partir du HD
  $scope.loadParamHd = ()=>
  {
    return $q(function(resolve, reject)
    {
      $http({
        method: 'GET',
        url: './' + $scope.tab_pathConfigFiles[3]
      }).
      success(function(response)
      {
        $scope.param = response;
        resolve(response);
        //$scope.afficheReponse("Fichier des paramètres sur disque chargé.");
      }).
      error(function(data, status, headers, config)
      {
        reject(data, status, headers, config);
        console.log(data);
      });
    });
  }


  //*******************************************************************************************//
  //****************************** Sauvegarde des données *************************************//
  //*******************************************************************************************//



  $scope.hdSave =  ()=>
  {
    for (let i = 0; i < $scope.tab_pathConfigFiles.length; i++) {
      let path = './' +$scope.tab_pathConfigFiles[i];

      switch (i) {
        case 0:
          data = JSON.stringify($scope.locomotives);
          break;
        case 1:
          data = JSON.stringify($scope.manufacturers);
          break;
        case 2:
          data = JSON.stringify($scope.cvLabels);
          break;
        case 3:
          data = JSON.stringify($scope.param);
          break;
      }
      
       /*__MODIF_16_03_23__start
$scope.socket.emit('hdSave', data, path);
    __MODIF_16_03_23__end*/
    }
  }


  //************************************* LocalStorage ***************************************//


  $scope.recLocalstorage = ()=>
  {
    localStorage.setItem("locomotives", JSON.stringify($scope.locomotives));
    localStorage.setItem("param", JSON.stringify($scope.param));
    localStorage.setItem("manufacturers", JSON.stringify($scope.manufacturers));
    localStorage.setItem("cvLabels", JSON.stringify($scope.cvLabels));
    $scope.localStorageLength = localStorage.length;
  }


  $scope.removeLocalstorage = ()=>
  {
    localStorage.removeItem("locomotives");
    localStorage.removeItem("param");
    localStorage.removeItem("manufacturers", JSON.stringify($scope.manufacturers));
    localStorage.removeItem("cvLabels", JSON.stringify($scope.cvLabels));
    $scope.localStorageLength = localStorage.length;
  }

  //******************* Sauvegarde automatique quand on quitte l'application ****************//


  window.onbeforeunload = (e)=>
  {
    console.log("End of session.");
    // on enregistre aussi toutes les données dans le "localStorage" du navigateur avant de quitter
    if ($scope.param.localStorageActive)
      $scope.recLocalstorage();
    // ... et sur le disque.
    $scope.saveHD();
  }



  //*******************************************************************************************//
  //********************************** Demarrage de l'appli ***********************************//
  //*******************************************************************************************//



  $scope.startCtrl = () =>
  { 
    // Chargement des fichiers à partir du localStorage
    $scope.loadLocalStorage();

    // ...ou sur le disque s'il n'y avait pas de données dans le local storage
    if ($scope.param == null)
      $scope.loadParamHd();

    if ($scope.locomotives == null)
      $scope.loadLocosHd();

    if ($scope.manufacturers == null)
      $scope.loadManufacturersHd();

    if ($scope.cvLabels == null)
      $scope.loadCvLabelsHd();

    $scope.initLoco();
    $scope.gauge.draw();

  }

  $scope.startCtrl();

});  // ->







