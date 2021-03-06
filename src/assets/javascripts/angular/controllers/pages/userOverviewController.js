'use strict';

var angular = require('angular');
var _ = require('lodash');

/**
 * Preview of user profile prior to viewing-as
 */
angular.module('calcentral.controllers').controller('UserOverviewController', function(adminService, advisingFactory, apiService, $routeParams, $scope) {
  $scope.academics = {
    isLoading: true,
    excludeLinksToRegistrar: true
  };
  $scope.targetUser = {
    isLoading: true
  };

  var defaultErrorDescription = function(status) {
    if (status === 403) {
      return 'You are not authorized to view this user\'s data.';
    } else {
      return 'Sorry, there was a problem fetching this user\'s data. Contact CalCentral support if the error persists.';
    }
  };

  var errorReport = function(status, errorDescription) {
    return {
      summary: status === 403 ? 'Access Denied' : 'Unexpected Error',
      description: errorDescription || defaultErrorDescription(status)
    };
  };

  var loadProfile = function() {
    var targetUserUid = $routeParams.uid;
    advisingFactory.getStudent({
      uid: targetUserUid
    }).success(function(data) {
      angular.extend($scope.targetUser, _.get(data, 'attributes'));
      $scope.targetUser.ldapUid = targetUserUid;
      $scope.targetUser.addresses = apiService.profile.fixFormattedAddresses(_.get(data, 'contacts.feed.student.addresses'));
      $scope.targetUser.phones = _.get(data, 'contacts.feed.student.phones');
      $scope.targetUser.emails = _.get(data, 'contacts.feed.student.emails');
      // 'student.fullName' is expected by shared code (e.g., photo unavailable widget)
      $scope.targetUser.fullName = $scope.targetUser.defaultName;
      apiService.util.setTitle($scope.targetUser.defaultName);
      // Get links to advising resources
      advisingFactory.getAdvisingResources({
        uid: targetUserUid
      }).then(function(data) {
        $scope.ucAdvisingResources = _.get(data, 'data.feed.ucAdvisingResources');
      });
    }).error(function(data, status) {
      $scope.targetUser.error = errorReport(status, data.error);
    }).finally(function() {
      $scope.targetUser.isLoading = false;
    });
  };

  var loadAcademics = function() {
    advisingFactory.getStudentAcademics({
      uid: $routeParams.uid
    }).success(function(data) {
      angular.extend($scope, data);
      // We use aliases in scope because the user overview page has cards that are shared with My Academics, etc.
      $scope.academics.universityRequirements = $scope.requirements;
    }).error(function(data, status) {
      $scope.academics.error = errorReport(status, data.error);
    }).finally(function() {
      $scope.academics.isLoading = false;
    });
  };

  $scope.targetUser.actAs = function() {
    adminService.actAs($scope.targetUser);
  };

  $scope.$on('calcentral.api.user.isAuthenticated', function(event, isAuthenticated) {
    if (isAuthenticated) {
      // Refresh user properties because the canSeeCSLinks property is sensitive to the current route.
      apiService.user.fetch()
      .then(loadProfile)
      .then(loadAcademics);
    }
  });
});
