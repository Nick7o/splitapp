using MediatR;
using SplitApp.Application.DTOs;
using System;
using System.Collections.Generic;

namespace SplitApp.Application.Queries;

public record GetGroupSettlementsQuery(Guid GroupId, Guid UserId) : IRequest<List<SettlementDto>>;
