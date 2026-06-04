export const dashboardContracts = {
  member: {
    cards: ['membershipStatus', 'upcomingBookings', 'eventRegistrations', 'recommendedResources', 'supportStatus'],
    actions: ['updateProfile', 'requestService', 'registerEvent', 'contactSupport']
  },
  practitioner: {
    cards: ['profileCompletion', 'verificationStatus', 'availabilitySummary', 'assignedBookings', 'credentialReview'],
    actions: ['editProfile', 'submitCredential', 'updateAvailability', 'reviewBookings']
  },
  admin: {
    cards: ['memberApplications', 'practitionerReviews', 'contentQueue', 'supportQueue', 'donationSummary'],
    actions: ['reviewApplication', 'publishContent', 'routeSupport', 'exportReport']
  },
  superAdmin: {
    cards: ['roleChanges', 'domainRegistry', 'integrationHealth', 'featureFlags', 'auditEvents'],
    actions: ['assignRole', 'reviewAudit', 'toggleFeature', 'lockdownSystem']
  }
};

export function getDashboardContract(role) {
  return dashboardContracts[role] || dashboardContracts.member;
}
