const { ManagementClient } = require('auth0');

let mgmt = null;

function getClient() {
    if (mgmt) return mgmt;
    mgmt = new ManagementClient({
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
        clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
    });
    return mgmt;
}

async function updateSettlementProfile(auth0UserId, profileData) {
    const client = getClient();
    await client.users.update({ id: auth0UserId }, { user_metadata: profileData });
}

async function getSettlementProfile(auth0UserId) {
    const client = getClient();
    const user = await client.users.get({ id: auth0UserId });
    return user.data.user_metadata || {};
}

async function updateProfileField(auth0UserId, field, value) {
    const client = getClient();
    const user = await client.users.get({ id: auth0UserId });
    const existing = user.data.user_metadata || {};
    await client.users.update({ id: auth0UserId }, {
        user_metadata: { ...existing, [field]: value }
    });
}

async function linkWhatsAppNumber(auth0UserId, phoneNumber) {
    return updateProfileField(auth0UserId, 'phone_number', phoneNumber);
}

async function blockUser(auth0UserId) {
    const client = getClient();
    await client.users.update({ id: auth0UserId }, { blocked: true });
    console.log(`🔒 Auth0 user blocked: ${auth0UserId}`);
}

async function unblockUser(auth0UserId) {
    const client = getClient();
    await client.users.update({ id: auth0UserId }, { blocked: false });
    console.log(`🔓 Auth0 user unblocked: ${auth0UserId}`);
}

module.exports = { updateSettlementProfile, getSettlementProfile, updateProfileField, linkWhatsAppNumber, blockUser, unblockUser };
