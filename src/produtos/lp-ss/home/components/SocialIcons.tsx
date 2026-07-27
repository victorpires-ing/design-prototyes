import type { SVGProps } from "react";

export const InstagramIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
);

export const FacebookIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M14 9h3l.4-3H14V4.5c0-.8.3-1.5 1.6-1.5H17V.2C16.6.1 15.5 0 14.4 0 11.9 0 10.3 1.5 10.3 4.3V6H7.5v3h2.8v11H14V9z" />
    </svg>
);

export const TiktokIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M16.5 5.8a4.7 4.7 0 0 1-2.9-2.1V3h-2.9v11.7a2.5 2.5 0 1 1-1.8-2.4V9.3a5.5 5.5 0 1 0 4.7 5.4V9.1a7.5 7.5 0 0 0 3 .9V6.4a4.7 4.7 0 0 1-.1-.6z" />
    </svg>
);

export const YoutubeIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M23 7.5a3 3 0 0 0-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 0 0 1 7.5 31 31 0 0 0 .6 12 31 31 0 0 0 1 16.5a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.4 12 31 31 0 0 0 23 7.5zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z" />
    </svg>
);
