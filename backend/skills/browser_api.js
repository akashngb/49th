/**
 * Roots Browser Skills - Expanded for All Modules
 * Defined as OpenClaw (Backboard) compatible tools.
 */

const BROWSER_TOOLS = [
    {
        type: "function",
        function: {
            name: "apply_for_sin",
            description: "Automate the Social Insurance Number (SIN) application process on Canada.ca.",
            parameters: {
                type: "object",
                properties: {
                    province: { type: "string", description: "The province of the applicant." },
                    fullName: { type: "string", description: "Full legal name as per immigration documents." },
                    status: { type: "string", enum: ["PR", "WorkPermit", "StudyPermit"], description: "Current immigration status." }
                },
                required: ["province", "fullName", "status"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "register_health_card",
            description: "Start the provincial health coverage registration (e.g., OHIP, MSP, RAMQ).",
            parameters: {
                type: "object",
                properties: {
                    province: { type: "string", description: "The province (e.g., Ontario, BC, Quebec)." },
                    address: { type: "string", description: "Residential address in the province." }
                },
                required: ["province", "address"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "search_career_opportunities",
            description: "Find job postings, credential recognition paths, or networking events in Canada.",
            parameters: {
                type: "object",
                properties: {
                    profession: { type: "string", description: "The applicant's profession (e.g., Software Engineer, Nurse)." },
                    city: { type: "string", description: "Target city for the job search." }
                },
                required: ["profession", "city"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "find_community_events",
            description: "Discover local community groups, volunteer opportunities, or arrival cohorts.",
            parameters: {
                type: "object",
                properties: {
                    interest: { type: "string", description: "User's interest or background (e.g., tech, hiking, Indian community)." },
                    city: { type: "string", description: "The city to search in." }
                },
                required: ["interest", "city"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "enroll_school",
            description: "Automate the school enrollment or daycare search process for family members.",
            parameters: {
                type: "object",
                properties: {
                    ageGroup: { type: "string", enum: ["Daycare", "Elementary", "Secondary"], description: "Age group of the child." },
                    city: { type: "string", description: "The city for enrollment." }
                },
                required: ["ageGroup", "city"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_policy_updates",
            description: "Search for real-time IRCC policy changes, status alerts, or visa processing times.",
            parameters: {
                type: "object",
                properties: {
                    visaType: { type: "string", description: "Type of visa or application status to check." }
                },
                required: ["visaType"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "generic_browser_research",
            description: "Perform any automated browser research for questions without a specialized tool.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "The research question or task (e.g., 'Find the nearest notary in Toronto')." }
                },
                required: ["query"]
            }
        }
    }
];

module.exports = { BROWSER_TOOLS };
