import vine, { errors } from "@vinejs/vine";
import prisma from "../DB/db.config.js";
import {
	createUnitSchema,
	requirementSchema,
	updateUnitSchema,
} from "../validations/unitValidation.js";

class unitController {
	static async createUnit(req, res) {
		try {
			const { adminId } = req.admin; // from JWT
			// const { name, description, isActive } = req.body;

			// Validate the request body against the schema
			const validator = vine.compile(createUnitSchema);
			const payload = await validator.validate(req.body);

			// Optionally ensure the admin belongs to an institution
			const admin = await prisma.admin.findUnique({
				where: { adminId },
				include: {
					institution: true,
				},
			});

			// Verify admin has institution access
			if (!admin || !admin.institutionId) {
				return res
					.status(403)
					.json({
						status: 403,
						message: "Not authorized to create units",
					});
			}

			// Check for duplicate unit name within institution
			const existingUnit = await prisma.unit.findFirst({
				where: {
					name: {
						equals: payload.name,
						mode: "insensitive", // Case-insensitive check
					},
					institutionId: admin.institutionId, // Ensure unit belongs to the same institution
				},
			});

			if (existingUnit) {
				return res
					.status(400)
					.json({ status: 400, message: "Unit name already exists" });
			}

			// Enhanced unit creation that includes requirements
			const newUnit = await prisma.$transaction(async (tx) => {
				const unit = await tx.unit.create({
					data: {
						name: payload.name,
						description: payload.description,
						isActive: payload.isActive ?? true,
						applicationDeadline: payload.applicationDeadline,
						maxApplications: payload.maxApplications,
						autoCloseAfterDeadline:
							payload.autoCloseAfterDeadline ?? true,
						examDate: payload.examDate ?? null,
						examTime: payload.examTime ?? null,
						examCenter: payload.examCenter ?? null,
						institutionId: admin.institutionId,
					},
				});

				// Create requirements if they exist in the payload
				if (payload.requirements && payload.requirements.length > 0) {
					const requirementData = payload.requirements.map((req) => ({
						unitId: unit.unitId, // Note: using unitId from schema
						sscStream: req.sscStream, // Must be one of: SCIENCE, ARTS, COMMERCE
						hscStream: req.hscStream, // Must be one of: SCIENCE, ARTS, COMMERCE
						minSscGPA: req.minSscGPA,
						minHscGPA: req.minHscGPA,
						minCombinedGPA: req.minCombinedGPA,
						minSscYear: req.minSscYear,
						maxSscYear: req.maxSscYear,
						minHscYear: req.minHscYear,
						maxHscYear: req.maxHscYear,
					}));

					await tx.unitRequirement.createMany({
						data: requirementData,
					});
				}

				// Return the complete unit with requirements

				return await tx.unit.findUnique({
					where: { unitId: unit.unitId },
					include: {
						requirements: true,
						institution: {
							select: {
								name: true,
								institutionId: true,
							},
						},
					},
				});
			});
			// Return the newly created unit with its requirements
			return res.status(201).json({ status: 201, data: newUnit });
		} catch (error) {
			if (error instanceof errors.E_VALIDATION_ERROR) {
				console.log(error.messages);
				return res.status(400).json({ errors: error.messages });
			} else {
				console.error("Unit creation error:", error); // This will show the real error
				console.error("Error stack:", error.stack); // Thi
				return res
					.status(500)
					.json({ status: 500, message: "Something went wrong" });
			}
		}
	}

	static async updateUnit(req, res) {
		try {
			const { adminId } = req.admin; // from JWT
			const { unitId } = req.params;

			// Validate the request body against the schema
			const validator = vine.compile(updateUnitSchema);
			const payload = await validator.validate(req.body);

			// Verify admin has institution access
			const admin = await prisma.admin.findUnique({
				where: { adminId },
				include: {
					institution: true,
				},
			});

			if (!admin || !admin.institutionId) {
				return res
					.status(403)
					.json({ status: 403, message: "Not authorized" });
			}

			// If updating name, ensure uniqueness within institution (case-insensitive)
			if (payload.name) {
				const existingWithName = await prisma.unit.findFirst({
					where: {
						name: { equals: payload.name, mode: "insensitive" },
						institutionId: admin.institutionId,
						NOT: { unitId },
					},
				});
				if (existingWithName) {
					return res
						.status(400)
						.json({
							status: 400,
							message: "Unit name already exists",
						});
				}
			}

			// Client may provide duplicate requirements; pre-validate and return helpful error
			if (payload.requirements !== undefined) {
				const combos = new Set();
				for (const r of payload.requirements) {
					const key = `${r.sscStream}-${r.hscStream}`;
					if (combos.has(key)) {
						return res.status(400).json({
							status: 400,
							message: `Duplicate stream combination detected: ${key}`,
						});
					}
					combos.add(key);
				}
			}

			if (!admin || !admin.institutionId) {
				return res.status(403).json({
					status: 403,
					message: "Not authorized to update units",
				});
			}

			// Check if unit exists and belongs to admin's institution
			const existingUnit = await prisma.unit.findFirst({
				where: {
					unitId,
					institutionId: admin.institutionId, // Ensure unit belongs to admin's institution
				},
				include: {
					requirements: true,
					institution: {
						select: {
							name: true,
							institutionId: true,
						},
					},
					_count: {
						select: {
							applications: true,
						},
					},
				},
			});

			if (!existingUnit) {
				return res.status(404).json({
					status: 404,
					message: "Unit not found or not authorized to update",
				});
			}

			// Check for duplicate name if name is being updated
			if (payload.name && payload.name !== existingUnit.name) {
				const duplicateUnit = await prisma.unit.findFirst({
					where: {
						name: {
							equals: payload.name,
							mode: "insensitive", // Case-insensitive check
						},
						institutionId: admin.institutionId,
						unitId: {
							not: unitId, // Exclude current unit from duplicate check
						},
					},
				});

				if (duplicateUnit) {
					return res.status(400).json({
						status: 400,
						message: "Unit name already exists in your institution",
					});
				}
			}

			// Validate deadline if being updated
			if (payload.applicationDeadline) {
				const now = new Date();
				if (new Date(payload.applicationDeadline) <= now) {
					return res.status(400).json({
						status: 400,
						message: "Application deadline must be in the future",
					});
				}
			}

			// Use transaction to update unit and requirements together
			const updatedUnit = await prisma.$transaction(async (tx) => {
				const updateData = {};

				if (payload.name !== undefined) updateData.name = payload.name;
				if (payload.description !== undefined)
					updateData.description = payload.description;
				if (payload.isActive !== undefined)
					updateData.isActive = payload.isActive;
				if (payload.applicationDeadline !== undefined)
					updateData.applicationDeadline =
						payload.applicationDeadline;
				if (payload.maxApplications !== undefined)
					updateData.maxApplications = payload.maxApplications;
				if (payload.autoCloseAfterDeadline !== undefined)
					updateData.autoCloseAfterDeadline =
						payload.autoCloseAfterDeadline;

				// Always update the updatedAt timestamp
				updateData.updatedAt = new Date();

				// Update the unit
				const unit = await tx.unit.update({
					where: { unitId },
					data: updateData,
				});

				// Handle requirements update if provided
				if (payload.requirements !== undefined) {
					// Delete existing requirements
					await tx.unitRequirement.deleteMany({
						where: { unitId: unitId },
					});

					// Create new requirements if any provided
					if (payload.requirements.length > 0) {
						const requirementData = payload.requirements.map(
							(req) => ({
								unitId: unit.unitId,
								sscStream: req.sscStream,
								hscStream: req.hscStream,
								minSscGPA: req.minSscGPA,
								minHscGPA: req.minHscGPA,
								minCombinedGPA: req.minCombinedGPA,
								minSscYear: req.minSscYear,
								maxSscYear: req.maxSscYear,
								minHscYear: req.minHscYear,
								maxHscYear: req.maxHscYear,
							})
						);

						await tx.unitRequirement.createMany({
							data: requirementData,
						});
					}
				}
				// Return the complete updated unit with requirements
				return await tx.unit.findUnique({
					where: { unitId: unit.unitId },
					include: {
						requirements: true,
						institution: {
							select: {
								name: true,
								institutionId: true,
							},
						},
						_count: {
							select: {
								applications: true,
							},
						},
					},
				});
			});

			return res.json({
				status: 200,
				message: "Unit updated successfully",
				data: updatedUnit,
			});
		} catch (error) {
			if (error instanceof errors.E_VALIDATION_ERROR) {
				console.log(error.messages);
				return res.status(400).json({ errors: error.messages });
			} else {
				console.error("Unit update error:", error);
				console.error("Error stack:", error.stack);
				return res.status(500).json({
					status: 500,
					message: "Something went wrong",
				});
			}
		}
	}

	// Add this method to your unitController class

	static async addUnitRequirements(req, res) {
		try {
			const { adminId } = req.admin;
			const { unitId } = req.params;

			// Validate if adding single requirement or multiple
			let payload;
			if (req.body.requirements) {
				// Multiple requirements
				const validator = vine.compile(
					vine.object({
						requirements: vine
							.array(requirementSchema)
							.minLength(1),
					})
				);
				payload = await validator.validate(req.body);
			} else {
				// Single requirement
				const validator = vine.compile(requirementSchema);
				payload = {
					requirements: [await validator.validate(req.body)],
				};
			}

			// Verify admin has institution access
			const admin = await prisma.admin.findUnique({
				where: { adminId },
				include: { institution: true },
			});

			if (!admin || !admin.institutionId) {
				return res.status(403).json({
					status: 403,
					message: "Not authorized to add requirements",
				});
			}

			// Check if unit exists and belongs to admin's institution
			const unit = await prisma.unit.findFirst({
				where: {
					unitId,
					institutionId: admin.institutionId,
				},
				include: {
					requirements: true,
				},
			});

			if (!unit) {
				return res.status(404).json({
					status: 404,
					message: "Unit not found or not authorized",
				});
			}

			// Check for duplicate stream combinations
			const existingCombinations = unit.requirements.map(
				(req) => `${req.sscStream}-${req.hscStream}`
			);

			const newCombinations = payload.requirements.map(
				(req) => `${req.sscStream}-${req.hscStream}`
			);

			const duplicates = newCombinations.filter((combo) =>
				existingCombinations.includes(combo)
			);

			if (duplicates.length > 0) {
				return res.status(400).json({
					status: 400,
					message: `Stream combination(s) already exist: ${duplicates.join(
						", "
					)}`,
				});
			}

			// Add new requirements
			const requirementData = payload.requirements.map((req) => ({
				unitId: unit.unitId,
				sscStream: req.sscStream,
				hscStream: req.hscStream,
				minSscGPA: req.minSscGPA,
				minHscGPA: req.minHscGPA,
				minCombinedGPA: req.minCombinedGPA,
				minSscYear: req.minSscYear,
				maxSscYear: req.maxSscYear,
				minHscYear: req.minHscYear,
				maxHscYear: req.maxHscYear,
			}));

			await prisma.unitRequirement.createMany({
				data: requirementData,
			});

			// Return updated unit with all requirements
			const updatedUnit = await prisma.unit.findUnique({
				where: { unitId: unit.unitId },
				include: {
					requirements: true,
					institution: {
						select: {
							name: true,
							institutionId: true,
						},
					},
					_count: {
						select: {
							applications: true,
						},
					},
				},
			});

			return res.status(201).json({
				status: 201,
				message: `${payload.requirements.length} requirement(s) added successfully`,
				data: updatedUnit,
			});
		} catch (error) {
			if (error instanceof errors.E_VALIDATION_ERROR) {
				return res.status(400).json({
					status: 400,
					message: "Validation failed",
					errors: error.messages,
				});
			} else {
				console.error("Add requirements error:", error);
				return res.status(500).json({
					status: 500,
					message: "Something went wrong",
				});
			}
		}
	}

	// Also add method to remove specific requirements
	static async removeUnitRequirement(req, res) {
		try {
			const { adminId } = req.admin;
			const { unitId, requirementId } = req.params;

			// Verify admin has institution access
			const admin = await prisma.admin.findUnique({
				where: { adminId },
				include: { institution: true },
			});

			if (!admin || !admin.institutionId) {
				return res.status(403).json({
					status: 403,
					message: "Not authorized to remove requirements",
				});
			}

			// Check if unit exists and belongs to admin's institution
			const unit = await prisma.unit.findFirst({
				where: {
					unitId,
					institutionId: admin.institutionId,
				},
			});

			if (!unit) {
				return res.status(404).json({
					status: 404,
					message: "Unit not found or not authorized",
				});
			}

			// Check if requirement exists for this unit
			const requirement = await prisma.unitRequirement.findFirst({
				where: {
					id: requirementId,
					unitId: unitId,
				},
			});

			if (!requirement) {
				return res.status(404).json({
					status: 404,
					message: "Requirement not found",
				});
			}

			// Delete the requirement
			await prisma.unitRequirement.delete({
				where: { id: requirementId },
			});

			// Return updated unit
			const updatedUnit = await prisma.unit.findUnique({
				where: { unitId: unit.unitId },
				include: {
					requirements: true,
					institution: {
						select: {
							name: true,
							institutionId: true,
						},
					},
					_count: {
						select: {
							applications: true,
						},
					},
				},
			});

			return res.json({
				status: 200,
				message: "Requirement removed successfully",
				data: updatedUnit,
			});
		} catch (error) {
			console.error("Remove requirement error:", error);
			return res.status(500).json({
				status: 500,
				message: "Something went wrong",
			});
		}
	}

	static async listUnits(req, res) {
		try {
			let page = Number(req.query.page);
			if (!Number.isInteger(page) || page <= 0) {
				page = 1;
			}

			let limit = Number(req.query.limit);
			if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
				limit = 5;
			}

			const skip = (page - 1) * limit;

			const { adminId } = req.admin;
			const admin = await prisma.admin.findUnique({ where: { adminId } });
			if (!admin || !admin.institutionId) {
				return res
					.status(403)
					.json({ status: 403, message: "Not authorized" });
			}
			// Find all units for this institution
			const units = await prisma.unit.findMany({
				where: { institutionId: admin.institutionId },
				take: limit,
				skip: skip,
				include: {
					_count: { select: { applications: true } },
				},
			});

			const totalUnits = await prisma.unit.count({
				where: { institutionId: admin.institutionId },
			});

			const totalPages = Math.ceil(totalUnits / limit);

			return res.json({
				status: 200,
				data: units,
				metadata: {
					totalPages,
					currentPage: page,
					currentLimit: limit,
					totalUnits,
				},
			});
		} catch (error) {
			if (error instanceof errors.E_VALIDATION_ERROR) {
				// console.log(error.messages)
				return res.status(400).json({ errors: error.messages });
			} else {
				return res
					.status(500)
					.json({ status: 500, message: "Something went wrong" });
			}
		}
	}

	static async getUnitById(req, res) {
		try {
			const { adminId } = req.admin;
			const { unitId } = req.params;

			const admin = await prisma.admin.findUnique({ where: { adminId } });
			if (!admin || !admin.institutionId) {
				return res
					.status(403)
					.json({ status: 403, message: "Not authorized" });
			}

			const unit = await prisma.unit.findFirst({
				where: { unitId, institutionId: admin.institutionId },
				include: {
					requirements: true,
					_count: { select: { applications: true } },
				},
			});

			if (!unit) {
				return res
					.status(404)
					.json({ status: 404, message: "Unit not found" });
			}

			return res.json({ status: 200, data: unit });
		} catch (error) {
			return res
				.status(500)
				.json({ status: 500, message: "Something went wrong" });
		}
	}

	// Update only exam details for a unit
	static async setUnitExamDetails(req, res) {
		try {
			const { adminId } = req.admin;
			const { unitId } = req.params;
			const admin = await prisma.admin.findUnique({ where: { adminId } });
			if (!admin || !admin.institutionId) {
				return res
					.status(403)
					.json({ status: 403, message: "Not authorized" });
			}
			const unit = await prisma.unit.findFirst({
				where: { unitId, institutionId: admin.institutionId },
			});
			if (!unit)
				return res
					.status(404)
					.json({ status: 404, message: "Unit not found" });
			const { examDate, examTime, examCenter } = req.body || {};
			let dateVal = null;
			if (examDate) {
				const d = new Date(examDate);
				if (!isNaN(d.getTime())) dateVal = d;
			}
			const updated = await prisma.unit.update({
				where: { unitId },
				data: {
					examDate: examDate === undefined ? unit.examDate : dateVal,
					examTime: examTime === undefined ? unit.examTime : examTime,
					examCenter:
						examCenter === undefined ? unit.examCenter : examCenter,
				},
				select: {
					unitId: true,
					examDate: true,
					examTime: true,
					examCenter: true,
				},
			});
			return res.json({
				status: 200,
				message: "Unit exam details updated",
				data: updated,
			});
		} catch (error) {
			return res
				.status(500)
				.json({ status: 500, message: "Something went wrong" });
		}
	}

	static async deleteUnit(req, res) {
		try {
			const { adminId } = req.admin;
			const { unitId } = req.params;

			const admin = await prisma.admin.findUnique({ where: { adminId } });
			if (!admin || !admin.institutionId) {
				return res
					.status(403)
					.json({ status: 403, message: "Not authorized" });
			}

			// Ensure the unit belongs to this admin's institution
			const unit = await prisma.unit.findFirst({
				where: { unitId, institutionId: admin.institutionId },
			});
			if (!unit) {
				return res
					.status(404)
					.json({ status: 404, message: "Unit not found" });
			}

			await prisma.unit.delete({ where: { unitId } });
			return res.json({
				status: 200,
				message: "Unit deleted successfully",
				unitId,
			});
		} catch (error) {
			// Likely a foreign key constraint; surface a friendly message
			return res
				.status(400)
				.json({
					status: 400,
					message:
						"Unable to delete unit. Please remove related records first.",
				});
		}
	}

	// static async updateUnit(req, res) {
	//   const { unitId } = req.params;
	//   const { name, description, isActive } = req.body;
	//   try {
	//     // Update the unit record by its primary key
	//     const updated = await prisma.unit.update({
	//       where: { unitId },
	//       data: { name, description, isActive },
	//     });
	//     return res.json({ status: 200, data: updated });
	//   } catch (error) {
	//     console.error("Error updating unit:", error);
	//     return res.status(400).json({ status: 400, message: "Update failed" });
	//   }
	// }

	static async dashboard(req, res) {
		// This dashboard should be conrolled, viewed by System Admin, and it will be dynamic. When he click on view institutions, it will show all institutions, with total unit and students under that institutions. When he clicks on view units, it will show all units, with total students and applications under that unit. When he clicks on view students, it will show all students, with total applications under that student.

		// Thus the institution admin could check all the units, students, and applications under his institution.

		// Example stats; adjust as needed for actual requirements
		const totalInstitutions = await prisma.institution.count();
		const totalUnits = await prisma.unit.count();
		const totalStudents = await prisma.student.count();
		const totalApplications = await prisma.application.count();
		return res.json({
			status: 200,
			data: {
				institutions: totalInstitutions,
				units: totalUnits,
				students: totalStudents,
				applications: totalApplications,
			},
		});
	}
}

export default unitController;
