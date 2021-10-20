import Canvas from 'canvas';
import abbreviate from 'number-abbreviate';
import accents from 'accents';
import { PresenceStatus } from 'discord.js';
import { CardData, StatusColours, XPForLevel } from '.';

const shorten = (text: string, len: number) => {
    if (text.length <= len) return text;
    return `${text.substr(0, len).trim()}...`;
};

/**
 * Internal type to represent a piece of
 * @typedef {Object} Piece
 *
 * @property {T} value The piece of data
 * @property {string} fontColour The colour to render the data with
 * @property {number} fontSize The font size in pixels to render the data at
 * @property {boolean} display Whether the piece should be displayed or not
 *
 * @template T
 */
interface Piece<T> {
    value: T;
    fontColour: string;
    fontSize: number;
    display: boolean;
}

/**
 * Supported background input types. This can be:
 * * 'image'
 * * 'colour'
 * @typedef {string} BackgroundType
 */
type BackgroundType = 'image' | 'colour';

/**
 * Background
 * @typedef {Object} Background
 *
 * @property {BackgroundType} type The type of the input. Can be one of 'image' or 'colour'
 * @property {string | Buffer} value The inputted value. If 'image', Buffer. If 'colour', string.
 */
interface Background {
    type: BackgroundType;
    value: string | Buffer;
}

/**
 * Supported progress bar colour input types. This can be:
 * * 'gradient'
 * * 'colour'
 * @typedef {string} ProgressType
 */
type ProgressType = 'gradient' | 'colour';

/**
 * Placement and size measurements.
 * @typedef {Object} Moveable
 */
interface Moveable {
    x: number;
    y: number;
    height: number;
    width: number;
}

/**
 * Level progress
 * @typedef {Object} Progress
 *
 * @property {boolean} display Whether any progress related data should be displayed
 * @property {number} currentXP The current amount of XP the user has
 * @property {number} requiredXP The amount of XP required for the next level
 * @property {number} fontSize The size of the font for the data
 * @property {string} fontColour The colour for the progress font
 * @property {number} x The x coordinate
 * @property {number} y The y coordinate
 * @property {number} height The height in pixels
 * @property {number} width The width in pixels
 *
 * @property {Object} bar Progress bar data
 * @property {boolean} bar.rounded Whether or not the progress bar is rounded
 * @property {string} bar.trackColour The colour of the bar's track
 * @property {number} bar.radius The radius to use if the bar is rounded
 *
 * @property {Object} bar.colour
 * @property {ProgressType} bar.colour.type The type of the input. Can be one of 'colour' or 'gradient'.
 * @property {string | string[]} bar.colour.value The value of the input. If 'colour', string. If 'gradient', string[].
 */
interface Progress extends Moveable {
    display: boolean;
    currentXP: number;
    requiredXP: number;
    fontSize: number;
    fontColour: string;
    bar: {
        rounded: boolean;
        trackColour: string;
        colour: {
            type: ProgressType;
            value: string | string[];
        };
        radius: number;
    };
}

/**
 * Status
 * @typedef {Object} Status
 *
 * @property {boolean} display Whether the status should be displayed
 * @property {number} width The width of the line
 * @property {PresenceStatus} type The status of the user
 * @property {string} colour The colour of the status
 * @property {boolean} circle Whether the status should display in a small circle rather than a ring
 */
interface Status {
    display: boolean;
    width: number;
    type: PresenceStatus;
    colour: string;
    circle: boolean;
}

/**
 * Overlay
 * @typedef {Object} Overlay
 *
 * @property {boolean} display Whether the overlay should be displayed
 * @property {number} opacity The alpha/opacity value of the overlay
 * @property {string} colour The colour of the overlay
 */
interface Overlay {
    display: boolean;
    opacity: number;
    colour: string;
}

/**
 * Avatar
 * @typedef {Object} Avatar
 *
 * @property {string | Buffer} value The value of the avatar
 * @property {boolean} display Whether the avatar should be displayed or not
 * @property {number} x The x coordinate
 * @property {number} y The y coordinate
 * @property {number} height The height in pixels
 * @property {number} width The width in pixels
 * @property {number} radius The radius to use
 */
interface Avatar extends Moveable {
    value: string | Buffer;
    display: boolean;
    radius: number;
}

/**
 * Tag
 * @typedef {Object} Tag
 *
 * @property {boolean} display Whether the tag should be displayed
 * @property {number} fontSize The size of the font for the data
 * @property {string} fontColour The colour for the prog
 * @property {string} username The user's username
 * @property {string} discriminator The user's discriminator
 */
interface Tag {
    display: boolean;
    fontSize: number;
    fontColour: string;
    username: string;
    discriminator: string | number;
}

/**
 * Card config
 * @typedef {Object} CardConfig
 *
 * @property {boolean} [stripAccents] Whether accents should automatically be stripped from the user's tag
 * @property {number} [tagLength] The length to cap the user's tag at
 * @property {XPForLevel} xpForLevel A function that specifies how much XP is in a level
 * @property {StatusColours} [statusColours] Custom status colours!
 * @property {number} level The level of the member the rank card is being rendered for
 * @property {GuildMember} member The member to render the card for
 * @property {number} [rank] The rank that the member is at in either local or global leaderboards
 */
interface CardConfig extends CardData {
    tagLength: number;
    stripAccents: boolean;
    xpForLevel: XPForLevel;
    statusColours: StatusColours;
}

/**
 * A rank card, as used by Ayano!
 * @class
 * @public
 */
export default class RankCard {
    private width: number = 932;
    private height: number = 284;
    private tagLength: number = 10;
    private stripAccents = false;
    private background: Background;
    private progress: Progress;
    private avatar: Avatar;
    private status: Status;
    private overlay: Overlay;
    private level: Piece<number>;
    private rank: Piece<number>;
    private tag: Tag;

    /**
     * Creates a new Rank Card!
     * @param {CardConfig} config The data for the rank card to initialise with
     * @returns {RankCard}
     */
    constructor(config: CardConfig) {
        const { member } = config;

        this.tagLength = config.tagLength;
        this.stripAccents = config.stripAccents;

        this.background = {
            type: 'colour',
            value: '#23272a'
        };

        this.progress = {
            display: true,
            currentXP: config.xpForLevel(config.level),
            requiredXP: config.xpForLevel(config.level + 1),
            fontSize: 36,
            fontColour: '#ffffff',
            x: 275,
            y: 154,
            height: 37,
            width: 580,
            bar: {
                rounded: true,
                trackColour: '#484b4e',
                colour: {
                    type: 'colour',
                    value: '#ffffff'
                },
                radius: 18
            }
        };

        this.avatar = {
            value: member.user.avatarURL({ format: 'png' }),
            display: true,
            x: 35,
            y: 45,
            height: 180,
            width: 180,
            radius: 100
        };

        this.status = {
            display: true,
            width: 5,
            type: member.presence.status,
            colour: config.statusColours[member.presence.status],
            circle: false
        };

        this.overlay = {
            display: true,
            opacity: 0.5,
            colour: '#333640'
        };

        this.level = {
            value: config.level,
            fontColour: '#ffffff',
            fontSize: 36,
            display: true
        };

        this.rank = {
            value: config.rank,
            fontColour: '#ffffff',
            fontSize: 36,
            display: config.rank ? true : false
        };

        this.tag = {
            display: true,
            fontColour: '#ffffff',
            fontSize: 42,
            username: member.user.username,
            discriminator: member.user.discriminator
        };
    }

    /**
     * Calculates the progress the progress bar should be at
     * @returns {number}
     * @private
     */
    private calculateProgress(): number {
        return (this.progress.currentXP / this.progress.requiredXP) * this.progress.width;
    }

    /**
     * Renders the rank card!
     * @param {string} font The font to render the card with
     * @returns {Promise<Buffer>}
     * @async
     */
    async render(font: string): Promise<Buffer> {
        // todo: parse the username

        // Define constants used in the code regardless of display
        const progressText = `${abbreviate(this.progress.currentXP)}/${abbreviate(
            this.progress.requiredXP
        )}`;

        // Create an instance of Canvas
        const canvas = Canvas.createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');
        ctx.textAlign = 'start';

        // Draw the background
        switch (this.background.type) {
            case 'image':
                const bg = await Canvas.loadImage(this.background.value);
                ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
                break;
            case 'colour':
                ctx.fillStyle = this.background.value as string;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                break;
        }

        // Draw the overlay
        if (this.overlay.display) {
            ctx.globalAlpha = this.overlay.opacity || 1;
            ctx.fillStyle = this.overlay.colour;
            ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

            // Reset transparency
            ctx.globalAlpha = 1;
        }

        // Draw the user's tag
        if (this.tag.display) {
            let tag = `${this.tag.username}#${this.tag.discriminator}`;

            // Format the tag
            if (this.tagLength > 0) tag = shorten(tag, this.tagLength);

            if (this.stripAccents) tag = accents(tag);

            ctx.font = `bold ${this.tag.fontSize}px ${font}`;
            ctx.fillStyle = this.tag.fontColour;

            ctx.fillText(tag, this.progress.x + 10, this.progress.y);
        }

        // Draw the avatar
        if (this.avatar.display) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(
                this.avatar.x + this.avatar.radius,
                this.avatar.y + this.avatar.radius,
                this.avatar.radius,
                0,
                Math.PI * 2,
                true
            );
            ctx.closePath();
            ctx.clip();

            const avatar = await Canvas.loadImage(this.avatar.value);
            ctx.drawImage(
                avatar,
                this.avatar.x,
                this.avatar.y,
                this.avatar.width + 20,
                this.avatar.height + 20
            );
            ctx.restore();
        }

        // Draw the status
        if (this.status.display) {
            if (this.status.circle) {
                ctx.beginPath();
                ctx.fillStyle = this.status.colour;
                ctx.arc(215, 205, 20, 0, 2 * Math.PI);
                this.avatar.x + this.avatar.radius,
                    this.avatar.y + this.avatar.radius,
                    this.avatar.radius;
                ctx.fill();
                ctx.closePath();
            } else if (!this.status.circle) {
                ctx.beginPath();
                ctx.arc(
                    this.avatar.x + this.avatar.radius,
                    this.avatar.y + this.avatar.radius,
                    this.avatar.radius,
                    0,
                    Math.PI * 2,
                    true
                );
                ctx.strokeStyle = this.status.colour;
                ctx.lineWidth = this.status.width;
                ctx.stroke();
            }
        }

        if (this.progress.display) {
            // Get the progress bar colour ready
            let barColour;

            if (this.progress.bar.colour.type === 'gradient') {
                const gradientContext = ctx.createRadialGradient(
                    this.calculateProgress(),
                    0,
                    500,
                    0,
                    null,
                    null
                );
                (this.progress.bar.colour.value as string[]).forEach((colour, i) =>
                    gradientContext.addColorStop(i, colour)
                );
                barColour = gradientContext;
            } else {
                barColour = this.progress.bar.colour.value;
            }

            // Draw progress bar and the track
            ctx.beginPath();

            if (this.progress.bar.rounded) {
                // Draw the track
                ctx.fillStyle = this.progress.bar.trackColour;
                ctx.arc(
                    this.progress.x + this.progress.bar.radius,
                    this.progress.y + this.progress.bar.radius + (this.progress.height - 1.25),
                    this.progress.bar.radius,
                    1.5 * Math.PI,
                    0.5 * Math.PI,
                    true
                );
                ctx.fill();
                ctx.fillRect(
                    this.progress.x + this.progress.bar.radius,
                    this.progress.y + (this.progress.height - 1.25),
                    1.03101424979 * this.progress.width - this.progress.bar.radius,
                    this.progress.height
                );
                ctx.arc(
                    this.progress.x + 1.03101424979 * this.progress.width,
                    this.progress.y + this.progress.bar.radius + (this.progress.height - 1.25),
                    this.progress.bar.radius + 0.25,
                    1.5 * Math.PI,
                    0.5 * Math.PI,
                    false
                );
                ctx.fill();

                ctx.beginPath();

                // Draw the bar
                ctx.fillStyle = barColour;
                ctx.arc(
                    this.progress.x + this.progress.bar.radius,
                    this.progress.y + this.progress.bar.radius + (this.progress.height - 1.25),
                    this.progress.bar.radius,
                    1.5 * Math.PI,
                    0.5 * Math.PI,
                    true
                );
                ctx.fill();
                ctx.fillRect(
                    this.progress.x + this.progress.bar.radius,
                    this.progress.y + (this.progress.height - 1.25),
                    this.calculateProgress(),
                    this.progress.height
                );
                ctx.arc(
                    this.progress.x + this.progress.bar.radius + this.calculateProgress(),
                    this.progress.y + this.progress.bar.radius + (this.progress.height - 1.25),
                    this.progress.bar.radius + 0.25,
                    1.5 * Math.PI,
                    0.5 * Math.PI,
                    false
                );
                ctx.fill();
            } else {
                // Draw the bar
                ctx.fillStyle = barColour;
                ctx.fillRect(
                    this.progress.x,
                    this.progress.y,
                    this.calculateProgress(),
                    this.progress.height
                );

                // Draw the outline
                ctx.beginPath();
                ctx.strokeStyle = this.progress.bar.trackColour;
                ctx.lineWidth = 7;
                ctx.strokeRect(
                    this.progress.x,
                    this.progress.y,
                    this.progress.width,
                    this.progress.height
                );
            }

            // Show progress
            ctx.font = `${this.progress.fontSize}px ${font}`;
            ctx.fillStyle = this.progress.fontColour;

            ctx.fillText(
                progressText,
                this.progress.x + this.progress.width - ctx.measureText(progressText).width,
                this.progress.y
            );
        }

        ctx.save();

        // Draw the level
        if (this.level.display) {
            ctx.font = `${this.level.fontSize}px ${font}`;
            ctx.fillStyle = this.level.fontColour;

            ctx.fillText(
                `Level ${abbreviate(this.level.value)}`,
                this.progress.x + 10,
                this.progress.y - 75
            );
        }

        // Draw the rank
        if (this.rank.display) {
            ctx.font = `${this.rank.fontSize}px ${font}`;
            ctx.fillStyle = this.rank.fontColour;

            ctx.fillText(
                `Rank ${abbreviate(this.rank.value)}`,
                this.progress.x + this.progress.width - ctx.measureText(progressText).width,
                this.progress.y - 75
            );
        }

        ctx.restore();

        // Return the buffer
        return canvas.toBuffer();
    }
}
