export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { txHash, asset, paymentId } = req.body;
    const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

    // Capture User IP via Vercel headers
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;

    const payload = {
        embeds: [{
            title: "💎 Spatial Payment Submission",
            color: 0xff9500, // Exodus Orange
            fields: [
                { name: "Payment ID", value: `\`${paymentId}\``, inline: false },
                { name: "Asset Selection", value: asset || "Not Selected", inline: true },
                { name: "User IP", value: `\`${ip}\``, inline: true },
                { name: "Transaction Hash", value: `\`${txHash}\``, inline: false }
            ],
            footer: { text: "larping.pro • Secure Audit Log" },
            timestamp: new Date()
        }]
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ error: 'Webhook failed' });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Server Error' });
    }
}
