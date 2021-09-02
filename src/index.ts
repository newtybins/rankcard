import { GuildMember, PresenceStatus } from 'discord.js';
import * as Canvas from 'canvas';
import abbreviate from 'number-abbreviate';
import accents from 'accents';

const STATUS_COLOURS = {
	online: '#43b581',
	idle: 'faa61a',
	dnd: '#f04747',
	offline: '#747f8e',
	streaming: '#593595',
};

const shorten = (text: string, len: number) => {
	if (text.length <= len) return text;
	return `${text.substr(0, len).trim()}...`;
};

export default class RankCard {
	private data: RankCard.CardData;

	constructor(data: RankCard.Input) {
		const {
			user: member,
			xpForLevel: xpFor,
			rank,
			level,
			fonts,
			usernameLength,
			stripAccents,
		} = data;

		const parsedUsername = shorten(member.user.username, usernameLength ?? 15);

		// Register fonts provided
		if (fonts && fonts.length > 0) {
			fonts.forEach((font) => {
				Canvas.registerFont(font.path, {
					family: font.family,
					weight: font.weight,
					style: font.style,
				});
			});
		}

		// Default settings
		this.data = {
			width: 934,
			height: 282,
			background: {
				type: 'colour',
				value: '#23272a',
			},
			progressBar: {
				rounded: true,
				x: 275.5,
				y: 183.75,
				height: 37.5,
				width: 596.5,
				track: {
					colour: '#484b4e',
				},
				bar: {
					type: 'colour',
					value: '#ffffff',
				},
			},
			avatar: {
				source: member.user.avatarURL({ format: 'png' }),
				x: 70,
				y: 50,
				height: 180,
				width: 180,
			},
			status: {
				width: 5,
				type: member.presence.status,
				colour: STATUS_COLOURS[member.presence.status],
				circle: false,
			},
			rank: {
				display: rank ? true : false,
				data: rank,
				colour: '#ffffff',
				displayText: 'Rank',
				size: 54,
			},
			level: {
				display: true,
				data: level,
				colour: '#ffffff',
				displayText: 'Level',
				size: 54,
			},
			overlay: {
				display: true,
				level: 0.5,
				colour: '#333640',
			},
			currentXP: {
				data: xpFor(level),
				colour: '#ffffff',
				size: 48,
			},
			requiredXP: {
				data: xpFor(level + 1),
				colour: '#ffffff',
				size: 48,
			},
			discriminator: {
				data: member.user.discriminator,
				colour: '#ffffff',
				size: 60,
			},
			username: {
				data: stripAccents ? accents(parsedUsername) : parsedUsername,
				colour: '#ffffff',
				size: 60,
			},
		};
	}

	/**
	 * Calculates the progress the progress bar should be at
	 * @private
	 */
	private get calculateProgress() {
		const cx = this.data.currentXP.data as number;
		const rx = this.data.requiredXP.data as number;

		if (rx <= 0) return 1;
		if (cx > rx) return this.data.progressBar.width;

		let width = (cx * 615) / rx;
		if (width > this.data.progressBar.width) width = this.data.progressBar.width;

		return width;
	}

	/**
	 * Sets the background of the rank card!
	 * @param type The type of the input
	 * @param value The inputted value
	 */
	setBackground<T extends RankCard.BackgroundType>(
		type: T,
		value: T extends 'colour' ? string : Buffer
	) {
		this.data.background.type = type;
		this.data.background.value = value;
	}

	/**
	 * Sets the overlay of the rank card!
	 * @param colour The colour to make the overlay
	 * @param [level] The level to make the overlay
	 * @param [display] Whether the overlay should be displayed anymore
	 */
	setOverlay(colour: string, level = 0.5, display = true) {
		this.data.overlay.colour = colour;
		this.data.overlay.display = display;
		this.data.overlay.level = level;
		return this;
	}

	/**
	 * Updates data about the progress bar's style!
	 * @param type The type of the input
	 * @param value The inputted value
	 * @param [rounded] Whether the progress bar should be rounded or not
	 */
	setProgressBar<T extends RankCard.ProgressType>(
		type: T,
		value: T extends 'colour' ? string : string[],
		rounded = true
	) {
		this.data.progressBar.bar.type = type;
		this.data.progressBar.bar.value = value;
		this.data.progressBar.rounded = rounded;
		return this;
	}

	/**
	 * Update the progress bar's track colour!
	 * @param colour The colour to make the progress bar track!
	 */
	setProgressBarTrack(colour: string) {
		this.data.progressBar.track.colour = colour;
		return this;
	}

	async build(fonts: { bold: string; regular: string }) {
		// Create an instance of Canvas
		const canvas = Canvas.createCanvas(this.data.width, this.data.height);
		const ctx = canvas.getContext('2d');

		// Draw the background
		switch (this.data.background.type) {
			case 'image':
				const bg = await Canvas.loadImage(this.data.background.value);
				ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
				break;
			case 'colour':
				ctx.fillStyle = this.data.background.value as string;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				break;
		}

		// Draw the overlay
		if (this.data.overlay.display) {
			ctx.globalAlpha = this.data.overlay.level || 1;
			ctx.fillStyle = this.data.overlay.colour;
			ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
		}

		// Reset transparency
		ctx.globalAlpha = 1;

		// Draw the username
		ctx.font = `${this.data.username.size}px ${fonts.bold}`;
		ctx.fillStyle = this.data.username.colour;
		ctx.textAlign = 'start';

		ctx.fillText(this.data.username.data, 275.5, 164);

		// Draw the discriminator
		ctx.font = `${this.data.discriminator.size}px ${fonts.regular}`;
		ctx.fillStyle = this.data.discriminator.colour;
		ctx.textAlign = 'center';

		ctx.fillText(
			`#${this.data.discriminator.data}`,
			ctx.measureText(this.data.username.data).width + 365,
			164
		);

		// Draw the avatar
		ctx.save();
		ctx.beginPath();
		ctx.arc(135, 145, 100, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();

		const avatar = await Canvas.loadImage(this.data.avatar.source);
		ctx.drawImage(avatar, 35, 45, this.data.avatar.width + 20, this.data.avatar.height + 20);
		ctx.restore();

		// Draw the status
		if (this.data.status.circle) {
			ctx.beginPath();
			ctx.fillStyle = this.data.status.colour;
			ctx.arc(215, 205, 20, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();
		} else if (!this.data.status.circle) {
			ctx.beginPath();
			ctx.arc(135, 145, 100, 0, Math.PI * 2, true);
			ctx.strokeStyle = this.data.status.colour;
			ctx.lineWidth = this.data.status.width;
			ctx.stroke();
		}

		// Get the progress bar colour ready
		let barColour: string | Canvas.CanvasGradient;

		if (this.data.progressBar.bar.type === 'gradient') {
			// @ts-ignore
			const gradientContext = ctx.createRadialGradient(this.calculateProgress, 0, 500, 0);
			(this.data.progressBar.bar.value as string[]).forEach((colour, i) =>
				gradientContext.addColorStop(i, colour)
			);
			barColour = gradientContext;
		} else {
			barColour = this.data.progressBar.bar.value as string;
		}

		// Draw progress bar and the track
		ctx.beginPath();

		if (this.data.progressBar.rounded) {
			// Draw the track
			ctx.fillStyle = this.data.progressBar.track.colour;
			ctx.arc(275.5, 202.25, 18.5, 1.5 * Math.PI, 0.5 * Math.PI, true);
			ctx.fill();
			ctx.fillRect(275.5, 183.75, 596.5, 37.5);
			ctx.arc(872, 202.25, 18.75, 1.5 * Math.PI, 0.5 * Math.PI, false);
			ctx.fill();

			ctx.beginPath();

			// Draw the bar
			ctx.fillStyle = barColour;
			ctx.arc(275.5, 202.25, 18.5, 1.5 * Math.PI, 0.5 * Math.PI, true);
			ctx.fill();
			ctx.fillRect(275.5, 183.75, this.calculateProgress, 37.5);
			ctx.arc(275.5 + this.calculateProgress, 202.25, 18.75, 1.5 * Math.PI, 0.5 * Math.PI, false);
			ctx.fill();
		} else {
			// Draw the bar
			ctx.fillStyle = barColour;
			ctx.fillRect(
				this.data.progressBar.x,
				this.data.progressBar.y,
				this.calculateProgress,
				this.data.progressBar.height
			);

			// Draw the outline
			ctx.beginPath();
			ctx.strokeStyle = this.data.progressBar.track.colour;
			ctx.lineWidth = 7;
			ctx.strokeRect(
				this.data.progressBar.x,
				this.data.progressBar.y,
				this.data.progressBar.width,
				this.data.progressBar.height
			);
		}

		// Draw the level
		if (this.data.level.display) {
			ctx.font = `${this.data.level.size}px ${fonts.bold}`;
			ctx.fillStyle = this.data.level.colour;
			ctx.fillText(`${this.data.level.displayText} ${abbreviate(this.data.level.data)}`, 350, 85);
		}

		// Draw the rank
		if (this.data.rank.display) {
			ctx.save();
			ctx.font = `bold ${this.data.rank.size}px ${fonts.bold}`;
			ctx.fillStyle = this.data.rank.colour;
			ctx.fillText(
				`${this.data.rank.displayText} ${abbreviate(this.data.rank.data)}`,
				950 -
					ctx.measureText(`${this.data.rank.displayText} ${abbreviate(this.data.rank.data)}`).width,
				85
			);
			ctx.restore();
		}

		// Return the buffer
		return canvas.toBuffer();
	}
}

export namespace RankCard {
	export type BackgroundType = 'image' | 'colour';
	export type ProgressType = 'gradient' | 'colour';

	export interface Input {
		level: number;
		xpForLevel: (level: number) => number;
		user: GuildMember;
		rank?: number;
		fonts?: Font[];
		usernameLength?: number;
		stripAccents?: boolean;
	}

	export interface Font {
		path: string;
		family: string;
		weight?: string;
		style?: string;
	}

	interface PartialPiece<K> {
		data: K;
		colour: string;
		size: number;
	}

	interface Piece<K> extends PartialPiece<K> {
		display: boolean;
		displayText: string;
	}

	export interface CardData {
		width: number;
		height: number;
		background: {
			type: BackgroundType;
			value: string | Buffer;
		};
		progressBar: {
			rounded: boolean;
			x: number;
			y: number;
			height: number;
			width: number;
			track: {
				colour: string;
			};
			bar: {
				type: ProgressType;
				value: string | string[];
			};
		};
		avatar: {
			source: string | Buffer;
			x: number;
			y: number;
			height: number;
			width: number;
		};
		status: {
			width: number;
			type: PresenceStatus;
			colour: string;
			circle: boolean;
		};
		overlay: {
			display: boolean;
			level: number;
			colour: string;
		};
		rank: Piece<number>;
		level: Piece<number>;
		currentXP: PartialPiece<number>;
		requiredXP: PartialPiece<number>;
		discriminator: PartialPiece<string>;
		username: PartialPiece<string>;
	}
}