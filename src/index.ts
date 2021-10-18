import Canvas from 'canvas';
import { GuildMember, MessageAttachment } from 'discord.js';
import path from 'path';
import RankCard from './RankCard';

/**
 * A font to register with Canvas for usage during building.
 * @typedef {Object} Font
 *
 * @property {string} path The path to the font file
 * @property {string} family The name of the font family to register it under
 * @property {string} [weight] The weight of the font
 * @property {string} [style] The style of the font
 */
interface Font {
    path: string;
    family: string;
    weight?: string;
    style?: string;
}

/**
 * Calculates the amount of XP for a level.
 * @callback XPForLevel
 *
 * @param {number} level The level to calculate the amount of XP for
 * @returns {number} The amount of XP required for the provided level
 */
export type XPForLevel = (level: number) => number;

/**
 * A list of status colours that will be used by the rank card generator!
 * @typedef {Object} StatusColours
 *
 * @property {string} online
 * @property {string} idle
 * @property {string} dnd
 * @property {string} offline
 * @property {string} streaming
 */
export interface StatusColours {
    online: string;
    idle: string;
    dnd: string;
    offline: string;
    streaming: string;
}

/**
 * Config for the card generator
 * @typedef {Object} GeneratorConfig
 *
 * @property {boolean} [stripAccents] Whether accents should automatically be stripped from the user's tag
 * @property {number} [tagLength] The length to cap the user's tag at
 * @property {Font[]} [fonts] Fonts to automatically initialise for usage when rendering
 * @property {XPForLevel} xpForLevel A function that specifies how much XP is in a level
 * @property {string} [fileName] The file name to make the outputted attachment
 * @property {StatusColours} [statusColours] Custom status colours!
 */
export interface GeneratorConfig {
    stripAccents?: boolean;
    tagLength?: number;
    fonts?: Font[];
    xpForLevel: XPForLevel;
    fileName?: string;
    statusColours?: StatusColours;
}

/**
 * Data for rank cards to read
 * @typedef {Object} CardData
 *
 * @property {number} level The level of the member the rank card is being rendered for
 * @property {GuildMember} member The member to render the card for
 * @property {number} [rank] The rank that the member is at in either local or global leaderboards
 */
export interface CardData {
    level: number;
    member: GuildMember;
    rank?: number;
}

/**
 * The rank card generator.
 * @class
 */
class CardGenerator {
    private config: GeneratorConfig;

    /**
     * Initialises a new rank card generator!
     * @param {GeneratorConfig} config
     * @returns {CardGenerator}
     */
    constructor(config: GeneratorConfig) {
        this.config = config;

        // Regular & Bold
        Canvas.registerFont(path.join(__dirname, '..', 'assets', 'neutra.otf'), {
            family: 'Neutra'
        });

        // Register fonts provided
        if (config.fonts && config.fonts.length > 0) {
            config.fonts.forEach(font => {
                Canvas.registerFont(font.path, {
                    family: font.family,
                    weight: font.weight,
                    style: font.style
                });
            });
        }

        // Defaults
        this.config.statusColours = this.config.statusColours ?? {
            online: '#43b581',
            idle: '#faa61a',
            dnd: '#f04747',
            offline: '#747f8e',
            streaming: '#593595'
        };

        this.config.statusColours.online = this.config.statusColours.online ?? '#43b581';
        this.config.statusColours.idle = this.config.statusColours.idle ?? '#faa61a';
        this.config.statusColours.dnd = this.config.statusColours.dnd ?? '#f04747';
        this.config.statusColours.offline = this.config.statusColours.offline ?? '#747f8e';
        this.config.statusColours.streaming = this.config.statusColours.streaming ?? '#593595';
        this.config.fileName = this.config.fileName ?? 'RankCard.png';
    }

    /**
     * Renders a rank card with the given data
     * @param {CardData} data Data to populate the card with
     * @param {string} font The font to use while rendering the card
     * @returns {Promise<MessageAttachment>}
     */
    async generateCard(data: CardData, font: string = 'Neutra'): Promise<MessageAttachment> {
        const card = new RankCard({
            ...data,
            statusColours: this.config.statusColours,
            stripAccents: this.config.stripAccents,
            tagLength: this.config.tagLength,
            xpForLevel: this.config.xpForLevel
        });

        const buffer = await card.render(font);
        return new MessageAttachment(buffer, this.config.fileName);
    }

    /**
     * @type {StatusColours}
     */
    set statusColours(colours: Partial<StatusColours>) {
        for (const key in colours) {
            this.config.statusColours[key] = colours[key];
        }
    }

    /**
     * Register a font for usage with rank cards!
     * @param {Font} font The font data
     */
    addFont(font: Font) {
        Canvas.registerFont(font.path, {
            family: font.family,
            weight: font.weight,
            style: font.style
        });
    }
}

export default CardGenerator;
export { CardGenerator };
