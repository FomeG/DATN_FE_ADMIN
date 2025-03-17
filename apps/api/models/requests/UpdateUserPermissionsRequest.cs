using System;
using System.Collections.Generic;

namespace Bestora.Api.Models.Requests;

public class UpdateUserPermissionsRequest
{
    public List<string> Permissions { get; set; } = new();
    public List<Guid> RoleIds { get; set; } = new();
}