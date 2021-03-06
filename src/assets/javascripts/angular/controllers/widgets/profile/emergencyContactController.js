'use strict';

var angular = require('angular');
var _ = require('lodash');

/**
 * Emergency Contact controller
 */
angular.module('calcentral.controllers').controller('EmergencyContactController', function(apiService, profileFactory, $scope) {

  angular.extend($scope, {
    currentObject: {},
    emptyObject: {
      country: 'USA',
      primaryContact: 'N',
      sameAddressEmpl: 'N',
      samePhoneEmpl: 'N'
    },
    errorMessage: '',
    isLoading: true,
    isSaving: false,
    items: {
      content: [],
      editorEnabled: false
    }
  });

  /**
   * Emergency contact editor controls.
   */

  // Helper function that returns a safe default (empty string) for Campus
  // Solutions APIs if a value is specifically `null` or `undefined`.
  var sanitizeContactData = function(value) {
    return _.isNil(value) ? '' : value;
  };

  var actionCompleted = function(data) {
    apiService.profile.actionCompleted($scope, data, loadInformation);
  };

  var deleteCompleted = function(data) {
    $scope.isDeleting = false;
    actionCompleted(data);
  };

  var saveCompleted = function(data) {
    $scope.isSaving = false;
    actionCompleted(data);
  };

  $scope.closeEditor = function() {
    apiService.profile.closeEditor($scope);
  };

  $scope.cancelEdit = function() {
    $scope.isSaving = false;
    $scope.closeEditor();
  };

  $scope.deleteContact = function(item) {
    return apiService.profile.delete($scope, profileFactory.deleteEmergencyContact, {
      contactName: item.contactName
    }).then(deleteCompleted);
  };

  $scope.saveContact = function(item) {
    // Take only the first phone in the list. Any others are handled
    // individually by the inner `emergencyPhone` scope.
    var phone = item.emergencyPhones[0];

    apiService.profile.save($scope, profileFactory.postEmergencyContact, {
      // Let Campus Solutions growl about any required field errors.
      contactName: item.contactName,
      isPrimaryContact: item.primaryContact,
      relationship: item.relationship,
      isSameAddressEmpl: item.sameAddressEmpl,
      isSamePhoneEmpl: item.samePhoneEmpl,
      // Allow these items to be empty strings.
      addrField1: sanitizeContactData(item.addrField1),
      addrField2: sanitizeContactData(item.addrField2),
      addrField3: sanitizeContactData(item.addrField3),
      address1: sanitizeContactData(item.address1),
      address2: sanitizeContactData(item.address2),
      address3: sanitizeContactData(item.address3),
      address4: sanitizeContactData(item.address4),
      addressType: sanitizeContactData(item.addressType),
      city: sanitizeContactData(item.city),
      country: sanitizeContactData(item.country),
      county: sanitizeContactData(item.county),
      emailAddr: sanitizeContactData(item.emailAddr),
      geoCode: sanitizeContactData(item.geoCode),
      houseType: sanitizeContactData(item.houseType),
      inCityLimit: sanitizeContactData(item.inCityLimit),
      num1: sanitizeContactData(item.num1),
      num2: sanitizeContactData(item.num2),
      phone: sanitizeContactData(phone.phone),
      phoneType: sanitizeContactData(phone.phoneType),
      extension: sanitizeContactData(phone.extension),
      postal: sanitizeContactData(item.postal),
      state: sanitizeContactData(item.state)
    }).then(saveCompleted);
  };

  $scope.showAdd = function() {
    $scope.emptyObject.emergencyPhones = [angular.copy($scope.emergencyPhone.emptyObject)];

    apiService.profile.showAdd($scope, $scope.emptyObject);
  };

  $scope.showEdit = function(item) {
    apiService.profile.showEdit($scope, item);
  };

  /**
   * Emergency Phone editor is an inner controller in that is initialized by the
   * EmergencyContactController. Defined as an inner scope, emergencyPhone, on
   * the parent or EmergencyContact scope, we can pass it to the
   * `profileService` methods for safely updating the phone editor state.
   */
  angular.extend($scope, {
    emergencyPhone: {
      currentObject: {},
      emptyObject: {
        phone: '',
        phoneType: '',
        extension: '',
        countryCode: ''
      },
      errorMessage: '',
      isAdding: false,
      isDeleting: false,
      isLoading: true,
      isSaving: false,
      items: {
        content: [],
        editorEnabled: false
      },
      phoneTypes: {}
    }
  });

  var phoneActionCompleted = function(data) {
    apiService.profile.actionCompleted($scope.emergencyPhone, data, loadInformation);
  };

  var phoneDeleteCompleted = function(data) {
    $scope.emergencyPhone.isDeleting = false;
    phoneActionCompleted(data);
  };

  var phoneSaveCompleted = function(data) {
    $scope.emergencyPhone.isSaving = false;
    phoneActionCompleted(data);
  };

  $scope.emergencyPhone.cancelEdit = function() {
    var item = $scope.emergencyPhone.currentObject.data;
    $scope.emergencyPhone.isSaving = false;
    $scope.emergencyPhone.closeEditor();

    // Code smell: manual cleanup of isModifying on parent scoped phone.
    _.each($scope.currentObject.data.emergencyPhones, function(phone) {
      if (phone.contactName === item.contactName && phone.phoneType === item.phoneType) {
        phone.isModifying = false;
      }
    });
  };

  $scope.emergencyPhone.closeEditor = function() {
    $scope.emergencyPhone.isAdding = false;
    apiService.profile.closeEditor($scope.emergencyPhone);
  };

  $scope.emergencyPhone.deletePhone = function(item) {
    return apiService.profile.delete($scope, profileFactory.deleteEmergencyPhone, {
      contactName: item.contactName,
      phoneType: item.phoneType
    }).then(phoneDeleteCompleted);
  };

  $scope.emergencyPhone.save = function(item) {
    item.contactName = item.contactName || $scope.currentObject.data.contactName;

    return apiService.profile.save($scope, profileFactory.postEmergencyPhone, {
      // Let Campus Solutions growl about any required field errors.
      contactName: item.contactName,
      phone: item.phone,
      phoneType: item.phoneType,
      // Allow these items to be empty strings.
      extension: sanitizeContactData(item.extension),
      countryCode: sanitizeContactData(item.countryCode)
    }).then(phoneSaveCompleted);
  };

  $scope.emergencyPhone.showAdd = function() {
    apiService.profile.showAdd($scope.emergencyPhone, $scope.emergencyPhone.emptyObject);
    $scope.emergencyPhone.isAdding = true;
  };

  $scope.emergencyPhone.showEdit = function(item) {
    apiService.profile.showEdit($scope.emergencyPhone, item);
  };

  /**
   * Processes each emergencyContact for any emergencyPhones listed, creates a
   * flattened one-dimensional array of all phone objects, associates the
   * contactName with each phone for later use by post and delete, and assigns
   * the flat array to the inner `emergencyPhone` scope's contents.
   * @param {Array} emergencyContacts The user's emergencyContacts list.
   */
  var parseEmergencyPhones = function(emergencyContacts) {
    $scope.emergencyPhone.isLoading = true;

    var phones = _.map(emergencyContacts, function(contact) {
      if (_.isEmpty(contact.emergencyPhones)) {
        // Provides an empty phone to display, if no emergency phones have been
        // added yet. This enables contact editor to show empty phone inputs.
        contact.emergencyPhones = [angular.copy($scope.emergencyPhone.emptyObject)];
      }

      _.each(contact.emergencyPhones, function(phone) {
        phone.contactName = contact.contactName;
      });

      return contact.emergencyPhones;
    });

    $scope.emergencyPhone.items.content = _.flattenDeep(phones);
    $scope.emergencyPhone.isLoading = false;
  };

  var getTypesPhone = profileFactory.getTypesPhone;
  var parseTypesPhone = function(data) {
    $scope.emergencyPhone.phoneTypes = apiService.profile.filterTypes(_.get(data, 'data.feed.xlatvalues.values'), $scope.emergencyPhone.items);
  };

  /**
   * Sequence of functions for loading emergencyContact and emergencyPhone data.
   */
  var getEmergencyContacts = profileFactory.getEmergencyContacts;

  var parseEmergencyContacts = function(data) {
    var emergencyContacts = _.get(data, 'data.feed.students.student.emergencyContacts.emergencyContact') || [];

    parseEmergencyPhones(emergencyContacts);

    _(emergencyContacts).each(function(emergencyContact) {
      fixFormattedAddress(emergencyContact);
    });

    $scope.items.content = emergencyContacts;
  };

  var fixFormattedAddress = function(emergencyContact) {
    var formattedAddress = emergencyContact.formattedAddress || '';

    emergencyContact.formattedAddress = apiService.profile.fixFormattedAddress(formattedAddress);
  };

  var getTypesRelationship = profileFactory.getTypesRelationship;
  var parseTypesRelationship = function(data) {
    var relationshipTypes = apiService.profile.filterTypes(_.get(data, 'data.feed.xlatvalues.values'), $scope.items);

    $scope.relationshipTypes = sortRelationshipTypes(relationshipTypes);
  };
  /**
   * Sort relationshipTypes array in ascending order by description (text
   * displayed in select element), while pushing options representing "Other
   * Relative" (`R`), and generic "Other" (`O`) to the end of the sorted array.
   * @return {Array} The sorted array of relationship types.
   */
  var sortRelationshipTypes = function(types) {
    var OTHER_RELATIONSHIP = ['O', 'R'];

    return types.sort(function(a, b) {
      var left = a.fieldvalue;
      var right = b.fieldvalue;

      if (OTHER_RELATIONSHIP.indexOf(left) !== -1) {
        return 1;
      } else if (OTHER_RELATIONSHIP.indexOf(right) !== -1) {
        return -1;
      } else {
        return a.xlatlongname > b.xlatlongname;
      }
    });
  };

  var getCountries = profileFactory.getCountries;
  var parseCountries = function(data) {
    $scope.countries = _.sortBy(_.filter(_.get(data, 'data.feed.countries'), {
      hasAddressFields: true
    }), 'descr');
  };

  var countryWatch = function(country) {
    if (!country) {
      return;
    }

    $scope.currentObject.whileAddressFieldsLoading = true;

    profileFactory.getAddressFields({
      country: country
    })
    .then(parseAddressFields)
    .then(function() {
      // Get the states for specified country (if available)
      return profileFactory.getStates({
        country: country
      });
    })
    .then(parseStates)
    .then(function() {
      $scope.currentObject.whileAddressFieldsLoading = false;
    });
  };

  var parseAddressFields = function(data) {
    $scope.currentObject.addressFields = _.get(data, 'data.feed.labels');
  };

  var parseStates = function(data) {
    $scope.states = _.sortBy(_.get(data, 'data.feed.states'), 'descr');
  };

  /**
   * We need to watch when the country changes, if so, load the address fields
   * dynamically depending on the country.
   */
  var countryWatcher;

  var startCountryWatcher = function() {
    countryWatcher = $scope.$watch('currentObject.data.country', countryWatch);
  };

  /**
   *  If we're in the contact editor and we've updated a secondary emergency
   *  phone in the phone editor, then we need to grab the current contact being
   *  edited and match it with the updated item returned by the refreshed feed,
   *  and then pass the updated item to `showEdit` which repopulates the form
   *  with the updated information.
   */
  var refreshContactEditor = function() {
    var editingContact = $scope.currentObject.data;

    if (!editingContact) {
      return;
    }

    $scope.closeEditor();

    _.some($scope.items.content, function(contact) {
      var test = editingContact.contactName === contact.contactName && editingContact.relationship === contact.relationship;
      if (test) {
        editingContact = contact;
      }
      return test;
    });

    // Unset these so the contact editor controls are enabled.
    $scope.isSaving = false;
    $scope.isDeleting = false;

    $scope.showEdit(editingContact);
  };

  var loadInformation = function() {
    $scope.isLoading = true;

    // If we were previously watching a country, we need to remove that
    if (countryWatcher) {
      countryWatcher();
    }

    getEmergencyContacts({
      refreshCache: true
    })
    .then(parseEmergencyContacts)
    .then(getTypesRelationship)
    .then(parseTypesRelationship)
    .then(getTypesPhone)
    .then(parseTypesPhone)
    .then(getCountries)
    .then(parseCountries)
    .then(startCountryWatcher)
    .then(refreshContactEditor)
    .then(function() {
      $scope.isLoading = false;
    });
  };

  loadInformation();
});
