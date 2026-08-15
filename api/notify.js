export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { txHash, asset } = req.body;
    const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

    if (!WEBHOOK_URL) {
        console.error("Missing DISCORD_WEBHOOK environment variable");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Discord Embed Formatting
    const payload = {
        embeds: [{
            title: "Payment TEST",
            color: 0xff9500, // Exodus Orange
            fields: [
                { name: "Selected Asset", value: asset || "Unknown", inline: true },
                { name: "Status", value: "🟡 Pending Verification", inline: true },
                { name: "Transaction Hash", value: `\`${txHash}\`` }
            ],
            footer: { text: "larping.pro checkout" },
            timestamp: new Date()
        }]
    };

    try {
        const discordRes = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (discordRes.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ error: 'Discord rejected the webhook' });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
