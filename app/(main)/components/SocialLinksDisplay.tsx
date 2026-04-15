"use client";

import React from "react";
import { Twitter, Linkedin, Github, Mail } from "lucide-react";

interface SocialLinksDisplayProps {
    userId: string;
    showLabels?: boolean;
    className?: string;
}

interface SocialLinks {
    twitter?: string;
    linkedin?: string;
    github?: string;
    discord?: string;
}

export default function SocialLinksDisplay({
    userId,
    showLabels = true,
    className = "",
}: SocialLinksDisplayProps) {
    const [socialLinks, setSocialLinks] = React.useState<SocialLinks>({});

    React.useEffect(() => {
        try {
            const stored = localStorage.getItem(`social_links_${userId}`);
            if (stored) {
                setSocialLinks(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Failed to load social links:", error);
        }
    }, [userId]);

    if (Object.values(socialLinks).every((v) => !v)) {
        return null;
    }

    const links = [
        {
            platform: "Twitter",
            username: socialLinks.twitter,
            icon: Twitter,
            url: (username: string) => `https://x.com/${username}`,
            color: "hover:text-blue-400",
        },
        {
            platform: "LinkedIn",
            username: socialLinks.linkedin,
            icon: Linkedin,
            url: (username: string) => `https://linkedin.com/in/${username}`,
            color: "hover:text-blue-500",
        },
        {
            platform: "GitHub",
            username: socialLinks.github,
            icon: Github,
            url: (username: string) => `https://github.com/${username}`,
            color: "hover:text-gray-300",
        },
        {
            platform: "Discord",
            username: socialLinks.discord,
            icon: Mail,
            url: (username: string) => `#`,
            color: "hover:text-indigo-400",
        },
    ];

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {links.map(
                (link) =>
                    link.username && (
                        <a
                            key={link.platform}
                            href={
                                link.platform === "Discord"
                                    ? "#"
                                    : link.url(link.username)
                            }
                            target={link.platform !== "Discord" ? "_blank" : undefined}
                            rel={link.platform !== "Discord" ? "noopener noreferrer" : undefined}
                            title={`${link.platform}: ${link.username}`}
                            onClick={(e) => {
                                if (link.platform === "Discord") {
                                    e.preventDefault();
                                    alert(`Discord: ${link.username}`);
                                }
                            }}
                            className={`text-gray-400 transition ${link.color}`}
                        >
                            <link.icon size={20} />
                        </a>
                    )
            )}
        </div>
    );
}
