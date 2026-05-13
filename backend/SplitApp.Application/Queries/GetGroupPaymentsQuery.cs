using MediatR;
using SplitApp.Application.DTOs;
using System;
using System.Collections.Generic;

namespace SplitApp.Application.Queries;

public record GetGroupPaymentsQuery(Guid GroupId, Guid UserId, int Skip, int Take) : IRequest<List<GroupPaymentDto>>;
